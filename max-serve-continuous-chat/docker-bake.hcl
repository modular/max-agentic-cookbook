variable "PLATFORMS" {
  default = ["linux/amd64", "linux/arm64"]
}

group "default" {
  targets = ["ui"]
}

target "ui" {
  context = "."
  dockerfile = "Dockerfile.ui"
  platforms = "${PLATFORMS}"
  tags = ["llama3-chat-ui"]
  output = ["type=docker"]
}
