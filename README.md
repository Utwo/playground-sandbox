# Playground Sandbox

## Todo

- [x] For templates, clone directly from github
- [ ] Update to vue 3 reactive model
- [ ] Create files
- [ ] Have a small node server on every pod or a single server on core backend?
  - Single server on the backend means that we should have a shared volume for all pods in order to comunicate with the pod. Not good if many containers will write to the same volume I guess.
  - Small server on every pod means that we will instantiate a new server that will comunicate with our backend for CRUD file operations. We can also expose logs and start new terminals. Don't know if I need to expose this API and if yes how to handle auth and authz?
- [ ] Add terminal support
- [x] Loading state on create contaniner
- [ ] We can use watch and then push a message to the fr that the container is ready
- [ ] Test with gVizor
- [ ] Try with a tool that provides local development for k8s like Okteto or Werf
- [ ] Add a proper readme
- [ ] Deploy to cloud

### 1. Create cluster with volume claim

```
$ mkdir -p /tmp/k3dvol
$ k3d cluster create playground-sandbox --volume /tmp/k3dvol:/tmp/k3dvol
$ kubectl create namespace public
$ kubectl apply -f volume.yaml
```

### Install k8s-service-proxy

```
$ kubectl apply -f nginx-rc.yml
$ kubectl apply -f nginx-service.yml
```

### Get cluster DNS address

```
$ kubectl apply -f https://k8s.io/examples/admin/dns/dnsutils.yaml
$ kubectl exec -i -t dnsutils -- nslookup kubernetes.default
```

### Restart nginx

```
Take nginx.conf from ./k8s folder and update nginx.conf from nginx k8s pod
Reload nginx
$ nginx -s reload -c ./nginx.conf
```

### Change permission to volume if needed

```
$ sudo chown -R $USER /tmp/k3dvol
```

### Port forward nginx

```
$ kubectl port-forward services/pod-example 3001:80 -n public
$ kubectl port-forward services/nginx 8000:80 -n default
```

### Add entries to hosts

```
# Any subdomains that you want to use localy
$ echo "127.0.0.1   pod-example.playground-sandbox.com" >> /etc/hosts
$ echo "127.0.0.1   abc.playground-sandbox.com" >> /etc/hosts
```

### Run server

```
$ cd backend
$ npm run dev
```

### Compress an archive for templates

```
$ tar -cf playground-sandbox.tar.xz ./playground-sandbox
```
