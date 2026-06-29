import requests
url = "https://wakatime.com/developers"

response = requests.get(url)
with open("api.txt", "a") as f:
  f.write(response.text)