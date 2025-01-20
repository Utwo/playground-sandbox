# Playground Sandbox

A PoC allowing to run user provided code in a safe environment in cloud using ephemeral containers with Kubernetes and gVisor. Run any node project (vue, nextjs, nuxtjs, node, etc) in a sandbox and edit the code dorectly in the browser.

https://user-images.githubusercontent.com/282668/160847863-2051d3ee-0d04-4960-91b3-65371f7ca874.mp4

## Features

🚀 Clone any public projects from Github
🤘 Open the project directly in the browser in VSCode (openvscode)
🚢 Terminal support. Run commands in the container
👐 Run containers on any port
🎶 Get live container events
✨ Local development with Skaffold

## Challenges and open questions

Have a small node server on every sandboxed pod or a single server on core backend?

- Single server on the backend means that we should have a shared volume between all the pods and the backend server in order to read/write files. So all requests will go through the backend server and after authentication/authorization, it will write to the volume. From there the pods will pick up the files in order to run the sandboxed projects. This is what we have right now. Not good if many containers will write to the same volume I guess.
- Small server on every pod means that we will start a new server for every sandboxed project that will comunicate with our main backend for CRUD file operations. We can also expose logs and start new terminals directly from the sandboxed project. Don't know if I need to expose this sandboxed server to the frontend and if yes how to handle auth and authz?

## How to setup this beauty on local machine

### Install all the dependencies

Nix must be installed before running this command. If you don't want to install nix, take a look at the dependencies from [./devshell.toml](./devshell.toml) and make sure they are available on your host.

```
$ nix-shell
```

### Create a cluster with volume claim

```
$ k3d cluster create playground-sandbox --volume $(pwd)/tmp:/tmp/k3dvol -p"80:80@loadbalancer" -p "443:443@loadbalancer" --k3s-node-label "node=default@server:0"
```

### Run the backend and the frontend

```
$ cd frontend && pnpm install
$ cd backend && pnpm install
$ skaffold dev
```

Visit: http://127.0.0.1.nip.io

## Deploy infra

~~This will deploy just the backend. For the frontend, just connect it to a Vercel or a Netlify project.~~ Frontend will be deployed on k8s.

#### Terraform option:

```
$ cd terraform
$ terraform init
$ terraform apply
```

#### Manual option

Make a new K8s cluster on GCP with 2 node-pools. The first one, with label `node:default` will be used to run the backend of the application. For the second one, enable sandbox mode and set the label `node:sandbox`. The taint `NoSchedule: sandbox.gke.io/runtime=gvisor` should be automatically activated. The second node-pool will be used to run user containers.

Then create a new filestore instance and copy the newly created IP. Replace the IP in the helm/charts/playground-sandbox/values-prod.yaml ->nfs->server

### Deploy k8s manifest

For deploing the backend manifests, run:

```
$ skaffold run
```

### Others

For opening traefik web UI in the browser:

```

kubectl port-forward -n kube-system "$(kubectl get pods -n kube-system| grep '^traefik-' | awk '{print $1}')" 9000:9000

```
