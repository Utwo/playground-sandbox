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

### Create a cluster with volume claim

```
$ k3d cluster create playground-sandbox --volume /tmp/k3dvol:/tmp/k3dvol -p "8888:80@loadbalancer" --k3s-node-label "node=default@server:0"
```

### Run the backend and the frontend

```
$ cd backend && skaffold dev
$ cd frontend && npm run dev
```

### Deploy

This will deploy just the backend. For the frontend, just connect it to a Vercel or a Netlify project.

Make a new K8s cluster on GCP with 2 node-pools. The first one, with label `node:default` will be used to run the backend of the application. For the second one, enable sandbox mode and set the label `node:sandbox`. The taint `NoSchedule: sandbox.gke.io/runtime=gvisor` should be automatically activated. The second node-pool will be used to run user containers.

Then create a new filestore instance and copy the newly created IP. Replace the IP in the k8s/overlays/production/volume.yaml ->nfs->server

For deploing the backend manifests, run:

```
$ skaffold deploy
```

### Others

For opening traefik web UI in the browser:

```
kubectl port-forward -n kube-system "$(kubectl get pods -n kube-system| grep '^traefik-' | awk '{print $1}')" 9000:9000
```

If you run this on something else than k3d, then maybe you need to change the k8s internal ip in nginx.
First get the ip:

```
$ kubectl apply -f https://k8s.io/examples/admin/dns/dnsutils.yaml
$ kubectl exec -i -t dnsutils -- nslookup kubernetes.default
```

Update nginx-cm.yaml with the new ip;
