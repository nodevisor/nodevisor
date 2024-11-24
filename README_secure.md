# How to secure your Nodevisor cluster

# SSH

## Generate SSH key

```sh
ssh-keygen -t ed25519 -C "your-name"
```

File will be generated in `~/.ssh/id_ed25519`
Public key will be generated in `~/.ssh/id_ed25519.pub`

## Docker

### Docker Compose
