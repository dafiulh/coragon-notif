const express = require('express');
const app = express();
const rp = require('request-promise');
const port = process.env.PORT || 3000;

let app_id = '12fe1f4e-c50f-4321-961a-3fc7a36b7983';
let keys = 'Nzc4MzY3MDMtOGZlNi00MTVjLWI5MjItNGNlZDMwNjU0Nzhk';
 
app.get('/create', (req, res) => {

    res.header('Access-Control-Allow-Origin', 'https://coragon.web.app');
    res.header('Access-Control-Allow-Methods', 'GET');

    let title = req.query.title || 'Coragon Notification';
    let body = req.query.body;
    let time = req.query.time;

    if(!body){
        return res.status(400).send({
            status: 400,
            success: false,
            message: "Missing notification body"
        });
    }

    if(title.length>25 || body.length>90){
        return res.status(403).send({
            status: 403,
            success: false,
            message: "Maximum character limit exceeded (25 for title and 90 for body)"
        });
    }

    let options = {
        method: 'POST',
        uri: 'https://onesignal.com/api/v1/notifications',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Basic '+keys
        },
        body: {
            'app_id': app_id,
            'included_segments': ['All'],
            'url': 'https://coragon.web.app/events',
            'ttl': 86000,
            'headings': {
                'en': title,
                'id': title
            },
            'contents': {
                'en': body,
                'id': body
            }
        }
    };

    if(time !== undefined){
        time = Number(time);
        let lg = time.toString().length;
        if (!!time && (lg === 10 || lg === 13)){
            if (lg === 10) time *= 1000;
            options.body.send_after = new Date(time);
        } else {
            return res.status(400).send({
                status: 400,
                success: false,
                message: "Invalid timestamp, use the correct UNIX Epoch Time format"
            });
        }
    }

    options.body = JSON.stringify(options.body);

    rp(options).then(function(body){
        return res.status(200).send({
            status: 200,
            success: true,
            notif_id: JSON.parse(body)["id"],
            recipients: JSON.parse(body)["recipients"]
        });
    }).catch(function(error){
        return res.status(error.statusCode).send({
            status: error.statusCode,
            success: false,
            message: JSON.parse(error.response.body)["errors"][0]
        });
	});
	
});

app.get('/cancel', (req, res) => {

    res.header('Access-Control-Allow-Origin', 'https://coragon.web.app');
    res.header('Access-Control-Allow-Methods', 'GET');

    let notif_id = req.query.notif_id;

    if(notif_id === undefined){
        return res.status(400).send({
            status: 400,
            success: false,
            message: "Missing notification ID"
        });
    }

    rp({
        method: 'DELETE',
        uri: 'https://onesignal.com/api/v1/notifications/'+notif_id+'?app_id='+app_id,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Basic '+keys
        }
    }).then(function(body){
        return res.status(200).send({
            status: 200,
            success: JSON.parse(body)["success"]
        });
    }).catch(function(error){
        return res.status(error.statusCode).send({
            status: error.statusCode,
            success: false,
            message: JSON.parse(error.response.body)["errors"][0]
        });
    });

});
 
app.listen(port);