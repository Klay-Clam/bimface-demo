$(function () {
    // let ViewToken = '';
    fileChange();
    getFiles();
})

function getFiles() {
    $.ajax({
        url: '/get/files',
        type: 'GET',
        success: res => {
            console.log(res);
            if (res.code === 'success') {
                let data = res.data;
                let html = ``;
                let fileListRoot = $('#filelistRoot');
                for (let i = 0; i < data.length; i++) {
                    html += `<div class="file-item">
                    <label>
                        FileName:
                        <input type="text" readonly value="${data[i].name}">
                    </label>
                    <label>
                        FileID:
                        <input type="text" readonly value="${data[i].fileId}">
                    </label>
                    <label>
                        FileSize:
                        <input type="text" readonly value="${(data[i].length/1024).toFixed(2)}KB">
                    </label>
                    <label>
                        CreateTime:
                        <input type="text" readonly value="${data[i].createTime}">
                    </label>
                    <label>
                        Status:
                        <input type="text" readonly value="${data[i].status}"> 
                    </label>
                    <label>
                        Etag:
                        <input type="text" readonly value="${data[i].etag}">
                    </label>
                    <label>
                        <button onclick="onTranslate(this,'${data[i].fileId}')">发起转换</button><span id="transTips"></span>
                    </label>
                    <label>
                        <button onclick="initViewComponents('${data[i].fileId}')">查看详情</button><span id="viewTips"></span>
                    </label>
                </div>`
                }
                fileListRoot.html(html);
            } else {
                return;
            }
        }
    })
}

function onTranslate(e, fileId) {
    // console.log(fileId);
    console.log(e.nextElementSibling.innerText)
    $.ajax({
        url: '/put/translate',
        type: 'PUT',
        data: {
            fileId: fileId
        },
        success: function (res) {
            console.log(res);
            e.nextElementSibling.innerText = res.code
            e.disabled = true;
        },
        error: function (err) {
            console.log(err)
        }
    })
}

function onViewFile(fileId) {
    console.log(fileId);
}

function fileChange() {
    var file = $('#uploadModel');
    file.change(function () {
        var data = new FormData();
        data.append('models', file[0].files[0]);
        $.ajax({
            url: '/upload',
            type: 'POST',
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            success: function (res) {
                console.log(res);
            },
            error: function (err) {
                console.log(err)
            }
        })
    })
}

function uploadFile(data) {
    $.ajax({
        url: '/upload',
        method: 'POST',
        data: data,
        success: function (res) {
            console.log(res);
        },
        error: function (err) {
            console.log(err)
        }
    })
}

// 初始化显示组件
function initViewComponents(fileId) {

    $.ajax({
        url: `/get/view?fileId=${fileId}`,
        type: 'GET',
        success: function (res) {
            console.log(res)
            console.log(typeof res)
            console.log('code', res.code);
            console.log('data', res.data);
            if (res.code === 'success') {
                let ViewToken = res.data;
                console.log(ViewToken);
                document.getElementById('domRoot').innerHTML = '';
                var options = new BimfaceSDKLoaderConfig();
                options.viewToken = ViewToken;
                BimfaceSDKLoader.load(options, successCallback, failureCallback);
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}

// 视图初始化成功回调函数
function successCallback(viewMetaData) {
    // 创建WebApplication，直接显示模型或图纸
    var dom4Show = document.getElementById('domRoot');
    new Glodon.Bimface.Application.WebApplicationDemo(viewMetaData, dom4Show);
}
// 视图初始化失败回调函数
function failureCallback(error) {
    console.log(error);
};