# Playground Sandbox

A PoC allowing to run user provided code in a safe environment in cloud using ephemeral containers with Kubernetes and gVisor. Run any node project (vue, nextjs, nuxtjs, node, etc) in a sandbox and edit the code dorectly in the browser.

## Features

🚀 Clone any public projects from Github  
🤘 Open the project directly in the browser in VSCode (openvscode)  
🚢 Terminal support. Run commands in the container  
🎶 Get live container events  
✨ Local development with Skaffold

## Challenges and open questions

Have a small node server on every sandboxed pod or a single server on core backend?

- Single server on the backend means that we should have a shared volume between all the pods and the backend server in order to read/write files. So all requests will go through the backend server and after authentication/authorization, it will write to the volume. From there the pods will pick up the files in order to run the sandboxed projects. This is what we have right now. Not good if many containers will write to the same volume I guess.
- Small server on every pod means that we will start a new server for every sandboxed project that will comunicate with our main backend for CRUD file operations. We can also expose logs and start new terminals directly from the sandboxed project. Don't know if I need to expose this sandboxed server to the frontend and if yes how to handle auth and authz?

## How to setup this beauty on local machine

### Create a cluster with volume claim

```
$ k3d cluster create playground-sandbox --volume /tmp/k3dvol:/tmp/k3dvol
```

### Run the backend and the frontend

```
$ cd backend && skaffold dev
$ cd frontend && npm run dev
```

### Add entries to hosts

Any subdomains(projects) that you want to use localy

```
$ echo "127.0.0.1   project-example.playground-sandbox.com" >> /etc/hosts
$ echo "127.0.0.1   abc.playground-sandbox.com" >> /etc/hosts
```

### Others

If you run this on something else than k3d, then maybe you need to change the k8s internal ip in nginx.
First get the ip:

```
$ kubectl apply -f https://k8s.io/examples/admin/dns/dnsutils.yaml
$ kubectl exec -i -t dnsutils -- nslookup kubernetes.default
```

Update nginx-k8s/nginx.conf with the new ip and deploy the image;
Or just ssh into the pod, copy the config reload nginx:

```
Reload nginx
$ nginx -s reload -c ./nginx.conf
```
