# Playground Sandbox

## Todo

- [ ] Add terminal support
- [ ] Add node_modules to archive
- [ ] Delete container is hanging
- [ ] Implement in socket.io
- [ ] Test with gVizor

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
$ nginx -s reload -c ./nginx.conf
```

### Port forward nginx

```
$ kubectl port-forward services/pod-example 3001:80 -n public
$ kubectl port-forward services/nginx 8000:80 -n default
```

### Add entries to hosts

```
$ echo "127.0.0.1   pod-example.playground-sandbox.com" >> /etc/hosts
$ echo "127.0.0.1   abc.playground-sandbox.com" >> /etc/hosts
```

### Run server

```
$ cd backend
$ npm run dev

```
