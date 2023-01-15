# Set Up
## Databases
1. Download MongoDB
2. Open MongoDBCompass, create a new connection with Authentication
3. Create a database named `AudioToText`
4. Create a collection named `tasks`

### Prevent create a new connection without Authentication (Optional)
1. Locate the following code in `/etc/mongod.conf`:

```
security:
authorization: "disabled"
```
2. Change authorization disabled to enabled and save the file.
```
security:
authorization: "enabled"
```
## AWS
1. In `C:\Users\USER_NAME\`, create `.aws` folder then create a `credentials` file
2. In `credentials`, fills in your AWS info:
```
[default]
aws_access_key_id = <YOUR_ACCESS_KEY_ID>
aws_secret_access_key = <YOUR_SECRET_ACCESS_KEY>
```

## .env
1. Create a .env
2. Check .env.template and fill in the corresponding info 