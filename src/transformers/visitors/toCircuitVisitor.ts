/* eslint-disable no-param-reassign, no-shadow, no-continue */

import cloneDeep from 'lodash.clonedeep';
import { buildNode } from '../../types/zokrates-types.js';
import { TODOError } from '../../error/errors.js';
import { traversePathsFast } from '../../traverse/traverse.js';
import NodePath from '../../traverse/NodePath.js';
//import getAllPrevSiblingNodes from '../../traverse/NodePath.js';
import { VariableBinding } from '../../traverse/Binding.js';
import { StateVariableIndicator } from '../../traverse/Indicator.js';

// below stub will only work with a small subtree - passing a whole AST will always give true!
// useful for subtrees like ExpressionStatements
const publicInputsVisitor = (thisPath: NodePath, thisState: any) => {
  const { node } = thisPath;
  if (!['Identifier', 'IndexAccess'].includes(thisPath.nodeType)) return;
  // even if the indexAccessNode is not a public input, we don't want to check its base and index expression nodes
  thisState.skipSubNodes = true;
  let { name } = thisPath.scope.getReferencedIndicator(node, true);
  const binding = thisPath.getReferencedBinding(node);
  // below: we have a public state variable we need as a public input to the circuit
  // local variable decs and parameters are dealt with elsewhere
  // secret state vars are input via commitment values
  if (
    binding instanceof VariableBinding &&
    (node.interactsWithSecret || node.baseExpression?.interactsWithSecret) &&
    (node.interactsWithPublic || node.baseExpression?.interactsWithPublic) &&
    binding.stateVariable && !binding.isSecret &&
    // if the node is the indexExpression, we dont need its value in the circuit
    !(thisPath.containerName === 'indexExpression')
  ) {
    // TODO other types
    if (thisPath.isMapping)
      name = name.replace('[', '_').replace(']', '').replace('.sender', '');
    const parameterNode = buildNode('VariableDeclaration', { name, type: 'field', isSecret: false, declarationType: 'parameter'});
    const fnDefNode = thisPath.getAncestorOfType('FunctionDefinition').node;
    fnDefNode._newASTPointer.parameters.parameters.push(parameterNode);
  }
};


/**
 * @desc:
 * Visitor transforms a `.zol` AST into a `.zok` AST
 * NB: the resulting `.zok` AST is custom, and can only be interpreted by this
 * repo's code generator. ZoKrates itself will not be able to interpret this
 * AST.
 */

const visitor = {
  ContractDefinition: {
    enter(path: NodePath) {
      const { node, parent } = path;
      node._newASTPointer = parent._newASTPointer;
    },
  },

  ImportDirective: {
    enter(path: NodePath, state: any) {
      const { node } = path;
      state.contractImports ??= [];
      state.contractImports.push({
        absolutePath: node.absolutePath,
        file: node.file,
      });
      // we assume all import statements come before all functions
    },

  },


  FunctionDefinition: {
    // parent._newASTPointer location is Folder.files[].
    enter(path: NodePath, state: any) {

      const { node, parent, scope } = path;
      if (node.kind === 'constructor') {
        // We currently treat all constructors as publicly executed functions.
        state.skipSubNodes = true;
        return;
      }

      // Check the function for modifications to any stateVariables.
      // We'll need to create a new circuit file if we find a modification.
      // TODO: will we also need a new circuit file even if we're merely 'referring to' a secret state (because then a nullifier might be needed?)
      if (scope.modifiesSecretState()) {
        // Let's create a new circuit File to represent this function.
        // We'll add a new 'File' node to our newAST:

        const newFunctionDefinitionNode = buildNode('FunctionDefinition', {
          name: 'main',
        });
        const newImportStatementListNode = buildNode('ImportStatementList');

        const { indicators } = scope;

        newImportStatementListNode.imports.push(
          ...buildNode('Boilerplate', {
            bpSection: 'importStatements',
            indicators,
          }),
        );

        // before creating a function node we check for functions with same name
        const fnName = path.getUniqueFunctionName();
        node.fileName = fnName;


        // After getting an appropriate Name , we build the node
        const newNode = buildNode('File', {
         fileName: fnName,
          fileId: node.id,
          nodes: [newImportStatementListNode, newFunctionDefinitionNode],
        });

        node._newASTPointer = newFunctionDefinitionNode; // TODO: we might want to make this point to newNode (the 'File') rather than newNode.nodes[1] (the 'FunctionDefinition'), so that in future we can more easily access the ImportStatements.

        const files = parent._newASTPointer;
        files.push(newNode);
      } else {
        // a non secret function - we skip it for circuits
        state.skipSubNodes = true;
      }
    },

    exit(path: NodePath, state: any) {
      const { node, scope } = path;
      const { indicators } = scope;
      const newFunctionDefinitionNode = node._newASTPointer;

      // We populate the boilerplate for the function
      newFunctionDefinitionNode.parameters.parameters.push(
        ...buildNode('Boilerplate', {
          bpSection: 'parameters',
          indicators,
        }),
      );

      newFunctionDefinitionNode.body.preStatements.push(
        ...buildNode('Boilerplate', {
          bpSection: 'preStatements',
          indicators,
        }),
      );

      newFunctionDefinitionNode.body.postStatements.push(
        ...buildNode('Boilerplate', {
          bpSection: 'postStatements',
          indicators,
        }),
      );

      if (indicators.msgSenderParam) {
        node._newASTPointer.parameters.parameters.unshift(
          buildNode('VariableDeclaration', {
            name: 'msg',
            declarationType: 'parameter',
            type: 'field',
          }),
        ); // insert a msgSender parameter, because we've found msg.sender in the body of this function.
      }
    },
  },

  ParameterList: {
    enter(path: NodePath) {
      const { node, parent } = path;
      const newNode = buildNode('ParameterList');
      node._newASTPointer = newNode.parameters;
      parent._newASTPointer[path.containerName] = newNode;
    },
  },

  Block: {
    enter(path: NodePath) {
      const { node, parent } = path;
      const newNode = buildNode('Block');
      node._newASTPointer = newNode.statements;
      parent._newASTPointer.body = newNode;
    },
  },

  VariableDeclarationStatement: {
    enter(path: NodePath, state: any) {
      const { node, parent, scope } = path;
      if (node.stateVariable) {
        throw new Error(
          `TODO: VariableDeclarationStatements of secret state variables are tricky to initialise because they're assigned-to outside of a function. Future enhancement.`,
        );
      }

      let declarationType: string;
      if (path.isLocalStackVariableDeclaration())
        declarationType = 'localStack';
      if (path.isFunctionParameterDeclaration()) declarationType = 'parameter';

      if (
        declarationType === 'localStack' &&
        !node.isSecret &&
        !scope.getReferencedIndicator(node).interactsWithSecret
      ) {
        // we don't want to add non secret local vars
        node._newASTPointer = parent._newASTPointer;
        state.skipSubNodes = true;
        return;
      }

      const newNode = buildNode('VariableDeclarationStatement');
      node._newASTPointer = newNode;
      parent._newASTPointer.push(newNode);
    },
  },

  BinaryOperation: {
    enter(path: NodePath) {
      const { node, parent } = path;
      const { operator } = node;

      const newNode = buildNode('BinaryOperation', { operator });
      node._newASTPointer = newNode;
      path.inList ? parent._newASTPointer.push(newNode) : parent._newASTPointer[path.containerName] = newNode;
    },
  },

  Assignment: {
    enter(path: NodePath) {
      const { node, parent } = path;
      const { operator } = node;
      const newNode = buildNode('Assignment', { operator });
      node._newASTPointer = newNode;
      parent._newASTPointer.expression = newNode;
    },

    exit(path: NodePath) {
      // Convert 'a += b' into 'a = a + b' for all operators, because zokrates doesn't support the shortened syntax.
      // We do this on exit, so that the child nodes of this assignment get transformed into the correct zokrates nodeTypes (otherwise they might get missed).
      const expandAssignment = (node: any) => {
        const { operator, leftHandSide, rightHandSide } = node;
        const expandableOps = ['+=', '-=', '*=', '/=', '%=', '|=', '&=', '^='];
        if (!expandableOps.includes(operator)) return node;
        const op = operator.charAt(0);
        const binOpNode = buildNode('BinaryOperation', {
          operator: op,
          leftExpression: leftHandSide,
          rightExpression: rightHandSide,
        });
        const assNode = buildNode('Assignment', {
          operator: '=',
          leftHandSide,
          rightHandSide: binOpNode,
        });
        return assNode;
      };

      const { parent } = path;
      const circuitNode = parent._newASTPointer.expression;
      const newNode = expandAssignment(circuitNode);
      // node._newASTPointer = newNode; // no need to ascribe the node._newASTPointer, because we're exiting.
      parent._newASTPointer.expression = newNode;
    },
  },

  TupleExpression: {
    enter(path: NodePath) {
      const { node, parent } = path;
      const newNode = buildNode(node.nodeType);
      node._newASTPointer = newNode.components;
      parent._newASTPointer[path.containerName] = newNode;
    },
  },

  UnaryOperation: {
    enter(path: NodePath) {
      const { node, parent } = path;
      const { operator, prefix, subExpression } = node;
      const newNode = buildNode(node.nodeType, { operator, prefix, subExpression });
      node._newASTPointer = newNode;
      if (Array.isArray(parent._newASTPointer[path.containerName])) {
        parent._newASTPointer[path.containerName].push(newNode);
      } else {
        parent._newASTPointer[path.containerName] = newNode;
      }
    }
  },

  ExpressionStatement: {
    enter(path: NodePath, state: any) {
      const { node, parent, scope } = path;
      const { expression } = node;
      // TODO: make sure isDecremented / isIncremented are also ascribed to UnaryOperation node (not just Assignment nodes).
      // TODO: what other expressions are there?
      // NOTE: THIS IS A TEMP BODGE - we need non-secrets when they interact with secrets later, add a check for local vars
      if (!node.containsSecret) {
        state.skipSubNodes = true;
        return;
      }
      const { isIncremented, isDecremented } = expression;
      let newNode: any;

      // TODO: tidy this up...
      if (isIncremented || isDecremented) {
        switch (expression.nodeType) {
          case 'Assignment': {
            const { leftHandSide: lhs, rightHandSide: rhs } = expression;
            const lhsIndicator = scope.getReferencedIndicator(lhs);

            if (!lhsIndicator.isPartitioned) break;

            const rhsPath = NodePath.getPath(rhs);
            // We need to _clone_ the path, because we want to temporarily modify some of its properties for this traversal. For future AST transformations, we'll want to revert to the original path.
            const tempRHSPath = cloneDeep(rhsPath);
            const tempRHSParent = tempRHSPath.parent;

            if (isDecremented) {
              newNode = buildNode('BoilerplateStatement', {
                bpType: 'decrementation',
                indicators: lhsIndicator,
                subtrahendId: rhs.id,
                ...(lhsIndicator.isMapping && {
                  mappingKeyName:
                    lhs.indexExpression?.name ||
                    lhs.indexExpression.expression.name,
                }), // TODO: tidy this
              });
              tempRHSPath.containerName = 'subtrahend'; // a dangerous bodge that works
              node._newASTPointer = newNode.subtrahend;
            } else {
              // isIncremented
              newNode = buildNode('BoilerplateStatement', {
                bpType: 'incrementation',
                indicators: lhsIndicator,
                addendId: rhs.id,
                ...(lhsIndicator.isMapping && {
                  mappingKeyName:
                    lhs.indexExpression?.name ||
                    lhs.indexExpression.expression.name,
                }), // TODO: tidy this
              });
              tempRHSPath.containerName = 'addend'; // a dangerous bodge that works
              node._newASTPointer = newNode.addend;
            }

            // The child of this 'ExpressionStatement' node is an 'Assignment' node. But we've built a newNode to replace the 'Assignment' node of the original tree. The child of this newNode will be the RHS of the original 'Assignment' node. We discard the LHS, so we need to 'skip' the traversal of the 'Assignment' (using skipSubNodes = true), and instead traverse directly into the RHS node.

            tempRHSParent._newASTPointer = newNode;
            // we don't want to add public inputs twice:
            tempRHSPath.traverse(visitor, { skipPublicInputs: true });
            rhsPath.traversePathsFast(publicInputsVisitor, {});
            state.skipSubNodes = true;
            parent._newASTPointer.push(newNode);
            return;
          }
          default:
            throw Error(
              `Expressions of nodeType ${expression.nodeType} are not yet supported. Please open a new issue in github (if none exists).`,
            );
        }
      }

      // Otherwise, copy this ExpressionStatement into the circuit's language.

      // But, let's check to see if this ExpressionStatement is an Assignment to a state variable. If it's the _first_ such assignment, we'll need to mutate this ExpressionStatement node into a VariableDeclarationStatement.

      let isVarDec: boolean = false;
      if (
        node.expression.nodeType === 'Assignment' &&
        node.expression.operator === '='
      ) {
        const assignmentNode = node.expression;
        const { leftHandSide: lhs } = assignmentNode;
        const referencedIndicator = scope.getReferencedIndicator(lhs);
        if (referencedIndicator instanceof StateVariableIndicator &&
          (lhs.id === referencedIndicator.referencingPaths[0].node.id ||
            lhs.id === referencedIndicator.referencingPaths[0].parent.id) && // the parent logic captures IndexAccess nodes whose IndexAccess.baseExpression was actually the referencingPath
          !(
            referencedIndicator.isWhole &&
            referencedIndicator.oldCommitmentAccessRequired
          ) // FIX - sometimes a variable will be declared twice when we insert oldCommitmentPreimage preStatements before an overwrite - we check here
        ) {
          isVarDec = true;
        }
      }

      newNode = buildNode('ExpressionStatement', { isVarDec });
      node._newASTPointer = newNode;
      parent._newASTPointer.push(newNode);
    },
  },

  VariableDeclaration: {
    enter(path: NodePath, state: any) {
      const { node, parent, scope } = path;
      if (node.stateVariable) {
        // Then the node represents assignment of a state variable.
        // State variables don't get declared within a circuit;
        // their old/new values are passed in as parameters.
        node._newASTPointer = parent._newASTPointer;
        state.skipSubNodes = true;
        return;
      }
      if (path.isFunctionReturnParameterDeclaration())
        throw new Error(
          `TODO: VariableDeclarations of return parameters are tricky to initialise because we might rearrange things so they become _input_ parameters to the circuit. Future enhancement.`,
        );

      let declarationType: string;
      // TODO: `memery` declarations and `returnParameter` declarations
      if (path.isLocalStackVariableDeclaration())
        declarationType = 'localStack';
      if (path.isFunctionParameterDeclaration()) declarationType = 'parameter';

      if (
        declarationType === 'localStack' &&
        !node.isSecret &&
        !scope.getReferencedIndicator(node).interactsWithSecret
      ) {
        // we don't want to add non secret local vars
        node._newASTPointer = parent._newASTPointer;
        state.skipSubNodes = true;
        return;
      }

      // If it's not declaration of a state variable, it's either a function parameter or a local stack variable declaration. We _do_ want to add this to the newAST.
      const newNode = buildNode('VariableDeclaration', {
        name: node.name,
        isSecret: node.isSecret,
        declarationType,
      });
      node._newASTPointer = newNode;
      if (Array.isArray(parent._newASTPointer)) {
        parent._newASTPointer.push(newNode);
      } else {
        parent._newASTPointer[path.containerName].push(newNode);
      }
    },
  },

  ElementaryTypeNameExpression: {
    enter(path: NodePath, state: any) {
      const { node, parent } = path;

      // node._newASTPointer = // no pointer needed, because this is a leaf, so we won't be recursing any further.
      parent._newASTPointer[path.containerName] = buildNode(
        'ElementaryTypeName',
        {
          name: node.name === 'bool' ? 'bool' : 'field', // convert uint & address types to 'field', for now.
        },
      );
      state.skipSubNodes = true;
    },
  },

  ElementaryTypeName: {
    enter(path: NodePath) {
      const { node, parent } = path;
      const supportedTypes = ['uint', 'uint256', 'address', 'bool'];
      if (!supportedTypes.includes(node.name))
        throw new Error(
          `Currently, only transpilation of types "${supportedTypes}" is supported. Got ${node.name} type.`,
        );

      // node._newASTPointer = // no pointer needed, because this is a leaf, so we won't be recursing any further.
      parent._newASTPointer[path.containerName] = buildNode(
        'ElementaryTypeName',
        {
          name: node.name === 'bool' ? 'bool' : 'field', // convert uint & address types to 'field', for now.
        },
      );
    },
  },

  Identifier: {
    enter(path: NodePath, state: any) {
      const { node, parent } = path;
      const { name } = node;
      // const binding = path.getReferencedBinding(node);
      // below: we have a public state variable we need as a public input to the circuit
      // local variable decs and parameters are dealt with elsewhere
      // secret state vars are input via commitment values
      if (!state.skipPublicInputs) path.traversePathsFast(publicInputsVisitor, {});

      // node._newASTPointer = // no pointer needed, because this is a leaf, so we won't be recursing any further.
      parent._newASTPointer[path.containerName] = buildNode('Identifier', {
        name,
      });
    },
  },

  Literal: {
    enter(path: NodePath) {
      const { node, parent } = path;
      const { value } = node;

      if (node.kind !== 'number')
        throw new Error(
          `Only literals of kind "number" are currently supported. Found literal of kind '${node.kind}'. Please open an issue.`,
        );

      // node._newASTPointer = // no pointer needed, because this is a leaf, so we won't be recursing any further.
      parent._newASTPointer[path.containerName] = buildNode('Literal', {
        value,
      });
    },
  },

  MemberAccess: {
    enter(path: NodePath, state: any) {
      const { parent } = path;

      if (!path.isMsgSender())
        throw new Error(`Struct property access isn't yet supported.`);

      // What follows assumes this node represents msg.sender:
      const newNode = buildNode('MsgSender');

      // node._newASTPointer = // no pointer needed, because this is a leaf, so we won't be recursing any further.
      parent._newASTPointer[path.containerName] = newNode;
      state.skipSubNodes = true;
    },
  },

  IndexAccess: {
    enter(path: NodePath, state: any) {
      const { node, parent } = path;

      if (!state.skipPublicInputs) path.traversePathsFast(publicInputsVisitor, {});

      const newNode = buildNode('IndexAccess');
      node._newASTPointer = newNode;
      parent._newASTPointer[path.containerName] = newNode;
    },
  },

  FunctionCall: {
    enter(path: NodePath, state: any) {
      const { parent, node } = path;

      // If this node is a require statement, it might include arguments which themselves are expressions which need to be traversed. So rather than build a corresponding 'assert' node upon entry, we'll first traverse into the arguments, build their nodes, and then upon _exit_ build the assert node.

      if (path.isRequireStatement() && !node.requireStatementPrivate) {
        // HACK: eventually we'll need to 'copy over' (into the circuit) require statements which have arguments which have interacted with secret states elsewhere in the function (at least)
        state.skipSubNodes = true;
        return;

        // newNode = buildNode('Assert', { arguments: node.arguments });
        //
        // node._newASTPointer = newNode;
        // parent._newASTPointer[path.containerName] = newNode;
        // return;
      }
      if (node.requireStatementPrivate) {
        throw new TODOError('Secret assert statements', node);
      }

      if (path.isExternalFunctionCall() || path.isExportedSymbol()) {
        // External function calls are the fiddliest of things, because they must be retained in the Solidity contract, rather than brought into the circuit. With this in mind, it's easiest (from the pov of writing this transpiler) if External function calls appear at the very start or very end of a function. If they appear interspersed around the middle, we'd either need multiple circuits per Zolidity function, or we'd need a set of circuit parameters (non-secret params / return-params) per external function call, and both options are too painful for now.

        // ignore external function calls; they'll be retained in Solidity, so won't be copied over to a circuit.
        state.skipSubNodes = true;
      }

      if (path.isZero()) {
        // The path represents 0. E.g. "address(0)", so we don't need to traverse further into it.
        state.skipSubNodes = true;

        // Let's replace this thing with a '0' in the new AST:
        const newNode = buildNode('Literal', { value: 0 });
        parent._newASTPointer[path.containerName] = newNode;
      }
    },
  },
};

export default visitor;