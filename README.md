# Playground Sandbox

## Todo

- [x] For templates, clone directly from github
- [x] We can use watch and then push a message to the fr that the container is ready
- [x] Add terminal support
- [ ] Try vscode in the browser https://github.com/gitpod-io/openvscode-server/
- [ ] Create files
- [ ] Test with gVizor
- [ ] Deploy to cloud
- [ ] Add a proper readme
- [ ] Update to vue 3 reactive model

- [ ] Have a small node server on every pod or a single server on core backend?
  - Single server on the backend means that we should have a shared volume for all pods in order to comunicate with the pod. Not good if many containers will write to the same volume I guess.
  - Small server on every pod means that we will instantiate a new server that will comunicate with our backend for CRUD file operations. We can also expose logs and start new terminals. Don't know if I need to expose this API and if yes how to handle auth and authz?
- [x] Try with a tool that provides local development for k8s like Skaffold, Okteto or Werf
- [x] Loading state on create contaniner

### Create cluster with volume claim

```
$ k3d cluster create playground-sandbox --volume /tmp/k3dvol:/tmp/k3dvol
$ skaffold dev
```

```
$ cd frontend && npm run dev
```

### Add entries to hosts

```
# Any subdomains that you want to use localy
$ echo "127.0.0.1   pod-example.playground-sandbox.com" >> /etc/hosts
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

### Compress an archive for templates

```
$ tar -cf playground-sandbox.tar.xz ./playground-sandbox
```
