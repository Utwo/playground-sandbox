Run isolated processes in Fly firecrakers microVMs.

```
export FLY_API_TOKEN=$(fly auth token)
export APP_NAME=playground-sandbox

flyctl machines api-proxy

fly volumes create sandbox_data --region ams --size 1 -a ${APP_NAME}

curl -i -X POST \
-H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
"http://127.0.0.1:4280/v1/apps" \
-d '{
  "app_name": "${APP_NAME}",
  "org_slug": "personal"
}'

flyctl ips allocate-v4 -a ${APP_NAME}

curl -i -X POST \
-H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
"http://127.0.0.1:4280/v1/apps/${APP_NAME}/machines" \
-d '{
  "name": "proxy-machine",
  "region": "ams",
  "config": {
    "image": "utwo/fastly-proxy:v1",
    "env": {
      "APP_ENV": "production"
    },
    "guest": {
        "cpu_kind": "shared",
        "cpus": 1,
        "memory_mb": 256
    },
    "services": [
      {
        "ports": [
          {
            "port": 443,
            "handlers": [
              "tls",
              "http"
            ]
          },
          {
            "port": 80,
            "handlers": [
              "http"
            ]
          }
        ],
        "protocol": "tcp",
        "internal_port": 8080
      }
    ]
  }
}'

curl -i -X POST \
-H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
"http://127.0.0.1:4280/v1/apps/${APP_NAME}/machines/e148e271c71689/stop"


curl -i -X DELETE \
-H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
"http://127.0.0.1:4280/v1/apps/${APP_NAME}/machines/e148e271c71689"

curl -i -X GET \
-H "Authorization: Bearer ${FLY_API_TOKEN}" -H "Content-Type: application/json" \
"http://127.0.0.1:4280/v1/apps/${APP_NAME}/machines"

```

# Blocker! I cannot mount different subpaths from the same volume to different machines.
