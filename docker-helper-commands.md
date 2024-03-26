# Docker commands useful to EscrowShield Zapp

## Rebuild EscrowShield Zapp image from scratch

```shell
docker build -t zapp-escrow -f Dockerfile --no-cache --force-rm=true . 
```

## Rebuild EscrowShield Zapp image using cache

```shell
docker build -t zapp-escrow -f Dockerfile . 
```

## Rebuild Timber image from scratch

```shell
docker build -t timber --no-cache --force-rm=true . 
```

## Rebuild MongoDB instance image for EscrowShield Zapp

```shell
docker build -t starlight-mongo -f Dockerfile.mongo .
```

## Rebuild MongoDB instance image for EscrowShield Zapp from scratch

```shell
docker build -t starlight-mongo -f Dockerfile.mongo --no-cache --force-rm=true . 
```

## Start Docker Compose without recreate to avoid keys recreation

```shell
docker compose up --no-recreate
```

## Start Docker Compose complete

```shell
docker compose up --build
```

## Access Docker image

```shell
docker exec -it timber-sender bash
```

```shell
docker exec -it zapp-sender bash
```
