/* eslint-disable no-param-reassign */

import yargs from 'yargs';
// import fs from 'fs';
import logger from '../utils/logger.mjs';
import { readJsonFile } from '../utils/filing.mjs';
import traverse from '../traverse/traverse.mjs';
import explode from './visitors/explode.mjs';
import {
  addNodePositionsVisitor,
  createSketchVisitor,
  // printNodesVisitor,
  // drawBranchesVisitor,
  printSketch,
} from './visitors/sketcherVisitors.mjs';

/**
 * Inspired by the Transformer
 * https://github.com/jamiebuilds/the-super-tiny-compiler
 */

const { argv } = yargs.usage('Usage: $0 -i <input file>').demandOption(['i']);
const ast = readJsonFile(argv.i);

function addNodePositions(oldAST) {
  // We'll create a `newAst` which like our previous AST will have a SourceUnit
  // node at the top.
  const newAST = {
    nodeType: 'SourceUnit',
    nodes: [], // so-called to match the original ast.
  };

  const state = {
    nodeCount: 0,
    nextLeafPos: 0,
    depth: 0,
    lineEndAtDepth: [],
  };

  // Next I'm going to cheat a little and create a bit of a hack. We're going to
  // use a property named `context` on our parent nodes that we're going to push
  // nodes to their parent's `context`. Normally you would have a better
  // abstraction than this, but for our purposes this keeps things simple.
  //
  // Just take note that the context is a reference *from* the old ast *to* the
  // new ast.
  oldAST._context = newAST.nodes;
  const dummyParent = {};
  dummyParent._context = newAST;
  // rename _context to _subtreeRef?

  // We'll start by calling the traverser function with our ast and a visitor.
  // The newAST will be mutated through this traversal process.
  traverse(oldAST, dummyParent, explode(addNodePositionsVisitor), state);
  logger.debug('PRINTING NEW AST:', newAST);

  // At the end of our transformer function we'll return the new ast that we
  // just created.
  return newAST;
}

function createSketch(ast) {
  const state = {
    depth: 0,
    lineEndAtDepth: [],
    sketch: [],
  };

  traverse(ast, null, explode(createSketchVisitor), state);
  console.log('OUTPUT STATE:', state);
  printSketch(state.sketch)

  return state.sketch;
}

// A sketcher function which will accept an ast.
function sketcher() {
  logger.debug('ast', ast);

  const newAST = addNodePositions(ast);
  const output = createSketch(newAST);
}

sketcher();

export default sketcher;