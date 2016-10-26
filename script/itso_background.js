(function(window, document, chrome) {
    'use strict';
    var active = null;
    
    var img = new window.Image();
    var canvas, ctx;
    var crop, b64;
    
    var captureResponse, uploadResponse;
    
    var camera = new window.Audio();
    camera.src = 'media/camera.mp3';

    function onCaptured(data) {
        img.src = data;
    }
    function createBlob(base64, cb) {
        var type = base64.match(/data:(.+);base64,/i);
        if (type === null) {
            return true;
        }
        type = type[1];
        if (type !== 'image/jpeg' && type !== 'image/png') return true;
        var b = window.atob(base64.substr(base64.indexOf(',') + 1));
        var i = 0, l = b.length;
        var buffer = new window.ArrayBuffer(l);
        var typedA = new window.Uint8Array(buffer);
        for (i; i < l; i++) {
            typedA[i] = b.charCodeAt(i);
        }
        var blob = new window.Blob([typedA.buffer], {type: type});
        cb(blob);
    }
    function upload(blob) {
        var xhr = new window.XMLHttpRequest();
        xhr.open('POST', 'https://itsosticky.com/resource/add_upload', true);
        var formData = new window.FormData();
        formData.append('upload', blob);
        xhr.onload = function() {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                uploadResponse({
                    message: 'success',
                    ref: 'https://itsosticky.com/' + data.ref
                });
                return true;
            }
            uploadResponse({
                message: 'error'
            });
        };
        xhr.send(formData);
    }
    function imgLoaded(e) {
        var img = e.target;
        chrome.tabs.getZoom(function(z) {
            document.body.appendChild(img);
            canvas.width = crop.w * z;
            canvas.height = crop.h * z;
            ctx.drawImage(img, crop.x * z, crop.y * z, crop.w * z, crop.h * z, 0, 0, crop.w * z, crop.h * z);
            b64 = canvas.toDataURL('image/png');
            captureResponse({data: b64});
        });
    }
    function toggle() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {message: 'status'}, function(response) {
                if (typeof response === 'undefined') {
                    chrome.tabs.insertCSS(null, {file: '/styles/itso_screen.css'}, function() {
                        if (typeof chrome.runtime.lastError === 'undefined') return true;
                    });
                    chrome.tabs.executeScript(null, {file: '/script/itso_content.js'}, function() {
                        if (typeof chrome.runtime.lastError === 'undefined') return true;
                    });
                    active = true;
                    chrome.browserAction.setIcon({path: 'icons/itso_icon_16_on.png', tabId: tabs[0].id});
                    return false;
                }
                if (response.message === true) {
                    chrome.tabs.sendMessage(tabs[0].id, {message: 'deactivate'}, function(response) {
        
                    });
                    chrome.browserAction.setIcon({path: 'icons/itso_icon_16_off.png', tabId: tabs[0].id});
                }
                if (response.message === false) {
                    chrome.tabs.sendMessage(tabs[0].id, {message: 'activate'}, function(response) {
                        
                    });
                    chrome.browserAction.setIcon({path: 'icons/itso_icon_16_on.png', tabId: tabs[0].id});
                }
            });
        });
    }

    function deactivate() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {message: 'deactivate'}, function(response) {

            });
        });
        active = false;
    }

    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');

    chrome.browserAction.onClicked.addListener(function(tab) {
        toggle();
    });          
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message === 'capture') {
            captureResponse = sendResponse;
            camera.play();
            crop = request;
            chrome.tabs.captureVisibleTab({format: 'png'}, onCaptured);
            return true;
        }
        if (request.message === 'upload') {
            uploadResponse = sendResponse;
            createBlob(b64, function(blob) {
                if (blob.size > 1024000) {
                    b64 = canvas.toDataURL('image/jpeg');
                    createBlob(b64, function(blob) {
                        upload(blob);
                    });
                }
                else {
                    upload(blob);
                }
            });
            return true;
        }
        if (request.message === 'deactivate') {
            deactivate();
        }
    }.bind(this));
    
    img.addEventListener('load', imgLoaded.bind(this), false);

})(window, document, chrome);