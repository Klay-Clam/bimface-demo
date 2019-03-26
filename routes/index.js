var express = require('express');
var request = require('request');
const path = require('path');
var fs = require('fs')
const multer = require('multer');
const Int64 = require('node-int64');
var router = express.Router();
const AppKey = 'rRyHYigAeHIeELcYbEWHuZkWCf68U2wA';
const AppSecret = 'vbsVc4tnSAB2cRkXcrhcp75hMWqovMly';
var OauthToken = '';

/* GET home page. */
function getToken() {
    const base64encodeAuth = new Buffer(`${AppKey}:${AppSecret}`).toString('base64');
    console.log(base64encodeAuth)
    return new Promise((reslove, reject) => {
        request({
                url: `https://api.bimface.com/oauth2/token`,
                method: 'POST',
                headers: {
                    Authorization: `Basic ${base64encodeAuth}`
                }
            },
            function (error, response, body) {
                if (!error) {
                    var data = eval('(' + body + ')');
                    reslove(data);
                    // OauthToken = body.token;
                } else {
                    reject(error)
                }
            })
    })

}
router.get('/', function (req, res, next) {
    getToken()
        .then(body => {
            OauthToken = body.data.token;
        })
    res.render('index');
});
// 获取文件列表
function getFilesPage() {
    return new Promise((reslove, reject) => {
        let options = {
            url: `https://file.bimface.com/files`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${OauthToken}`,
                'Content-Type': 'application/json'
            }
        };
        request(options, function (error, response, body) {
            if (!error) {
                reslove(response);
            } else {
                reject(error)
            }
        })
    })
}
router.get('/get/files', function (req, res, next) {
    getFilesPage()
        .then(response => {
            var data = eval('(' + response.body + ')');
            res.send(data)
        })
})
// 获取文件的转换状态
function getTranslateStatus(fileId) {
    return new Promise((reslove, reject) => {
        let options = {
            url: `https://api.bimface.com/translate?fileId=${fileId}`,
            method: 'GET',
            headers: {
                'Authorization': `bearer ${OauthToken}`,
                'Content-Type': 'application/json'
            }
        };
        request(options, function (error, response, body) {
            if (!error) {
                reslove(response);
            } else {
                reject(error)
            }
        })
    })
}
// 发起文件转换
function putTranslate(fileId) {
    return new Promise((reslove, reject) => {
        let options = {
            url: `https://api.bimface.com/translate`,
            method: 'PUT',
            headers: {
                'Authorization': `bearer ${OauthToken}`,
                'Content-Type': 'application/json'
            },
            json: {
                "source": {
                    "fileId": fileId,
                    "compressed": false,
                    "rootName": null
                },
                "priority": 2,
                "callback": null
            }
        };
        request(options, function (error, response, body) {
            if (!error) {
                reslove(response);
            } else {
                reject(error)
            }
        })
    })
}
router.put('/put/translate', function (req, res, next) {
    let fileId = req.body.fileId;
    getTranslateStatus(fileId)
        .then(response => {
            if (response.body.code === 'success') {
                res.send({
                    code: 'translated',
                    message: '文件已经转换成功,点击查看详情查看',
                    data: response.body.data
                })
            } else {
                // res.send(response.body);
                return putTranslate(fileId);
            }
        })
        .then(response => {
            res.send(response.body);
        })
})
// 获取view token
function getViewToken(fileId) {
    return new Promise((reslove, reject) => {
        let options = {
            url: `https://api.bimface.com/view/token/?fileId=${fileId}`,
            method: 'GET',
            headers: {
                'Authorization': `bearer ${OauthToken}`,
                'Content-Type': 'application/json'
            }
        }
        request(options, function (error, response, body) {
            if (!error) {
                reslove(response)
            } else {
                reject(error);
            }
        })
    })
}
// 查看文件详情
router.get('/get/view', function (req, res, next) {
    let fileId = req.query.fileId;
    getViewToken(fileId)
        .then(response => {
            var data = JSON.parse(response.body);
            // var data = JSON.stringify(response.body);
            res.send(data);
        })
})
// upload model files
//获取时间
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate;
    return currentdate.toString();
}
var datatime = 'public/images/' + getNowFormatDate();
var storage = multer.diskStorage({
    // 如果你提供的 destination 是一个函数，你需要负责创建文件夹
    destination: datatime,
    //给上传文件重命名，获取添加后缀名
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
var upload = multer({
    storage: storage
});
// 转发文件到bimface服务
function uploadFileToBimFace(req, data) {
    // let len = new Int64(data.length.toString(16));
    console.log(data.length)
    // console.log(len)
    return new Promise((reslove, reject) => {
        let options = {
            url: `https://file.bimface.com/upload?name=${req.file.originalname}`,
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${OauthToken}`,
                'Content-Length': data.length
            },
            data: data
        }
        request(options, function (error, response, body) {
            if (!error) {
                // console.log(response);
                console.log(body)
                reslove(body);
            } else {
                reject(error);
            }
        })
    })
}
router.post('/upload', upload.single('models'), (req, res, next) => {
    // 没有附带文件
    if (!req.file) {
        res.json({
            ok: false
        });
        return;
    }
    // 输出文件信息
    // console.log('====================================================');
    // console.log(req)
    // console.log('fieldname: ' + req.file.fieldname);
    console.log('originalname: ' + req.file.originalname);
    // console.log('encoding: ' + req.file.encoding);
    // console.log('mimetype: ' + req.file.mimetype);
    console.log('size: ' + (req.file.size / 1024).toFixed(2) + 'KB');
    // console.log('destination: ' + req.file.destination);
    // console.log('filename: ' + req.file.filename);
    // console.log('path: ' + req.file.path);
    // console.log('====================================================');
    fs.readFile(req.file.path, async (err, data) => {
        if (err) {
            next(err)
        }
        try {
            await uploadFileToBimFace(req, data)
                .then(result => {
                    console.log(result);
                    res.json({
                        status: 'success'
                    });
                })
            res.status(200).end();
        } catch (err) {
            next(err)
        }
    })
});
// router.get('/demo/school', function (req, res, next) {
//     res.render('school');
// })
module.exports = router;