# crashes-mailer

```shell

vim ~/.pm2/module_conf.json

{
    "crashes-mailer": {
        "smtp": {
          "host": "your-host",
          "port": 587,
          "user": "your-user",
          "password": "pwd",
          "disabled": false
        },
        "from": "from",
        "mailTo": "to mail",
        "replyTo": "",
        "prefix_subject": "prefix",
        "monitor_processes": ["your_process"],
        "interval": 43200000,
        "times": [0, 10, 100]
    }
}

```
