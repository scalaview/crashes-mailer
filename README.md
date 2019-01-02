# crashes-mailer

```shell

vim ~/.pm2/module_conf.json

{
  "smtp":
    {
        "host": "host",
        "port": 587,
        "user": "user",
        "password": "[password]",
        "disabled": false
    },
        "from": "from",
        "mailTo": "mail1, mail2",
        "replyTo": "",
        "prefix_subject": "[prefix]",
        "monitor_processes": ["your process name"]
    }
}

```
