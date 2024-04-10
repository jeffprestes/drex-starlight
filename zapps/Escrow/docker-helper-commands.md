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

## Start Docker Compose with previous images set

```shell
docker compose start
```

## Logs

First gets the services names

```shell
docker-compose ps -a
```

Later inform the name of the service you want to see the logs or leave it blank to see all

```shell
docker-compose logs -f -n 1000 zapp 
```


## Access Docker image

```shell
docker exec -it timber-sender bash
```

```shell
docker exec -it zapp-sender bash
```
