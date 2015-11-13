function shareButtons(options) {
    function jsonp(url, callback) {
        var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        window[callbackName] = function (data) {
            delete window[callbackName];
            document.body.removeChild(script);
            callback(data);
        };

        var script = document.createElement('script');
        script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
        script.async = true;
        document.body.appendChild(script);
    }

    function rq(a, xhr, mthd, params) {
        if (window.ActiveXObject) {
            try {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
                alert(e.message);
                xhr = null;
            }
        } else {
            xhr = new XMLHttpRequest();
        }
        mthd ? xhr.open(mthd, a) : xhr.open('GET', a);
        a = [];
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = xhr.then = function (onSuccess, onError, cb, data) {
            if (onSuccess && onSuccess.call) a = [, onSuccess, onError];
            if (xhr.readyState == 4) {
                cb = a[0 | xhr.status / 200];
                if (cb) {
                    try {
                        data = JSON.parse(xhr.responseText)
                    } catch (e) {
                        data = null
                    }
                    cb(data, xhr);
                }
            }
        };
        xhr.send(params);
        return xhr;
    }
    var services = ['facebook', 'twitter', 'linkedin', 'gplus', 'vk', 'email', 'pinterest'];
    var templates = {
        twitter: 'https://twitter.com/intent/tweet?url={url}&text={text}',
        pinterest: 'https://www.pinterest.com/pin/create/button/?media={image}&url={url}&description={text}',
        facebook: 'https://www.facebook.com/sharer.php?u={url}',
        vk: 'https://vkontakte.ru/share.php?url={url}&title={title}&description={text}&image={image}&noparse=true',
        linkedin: 'https://www.linkedin.com/shareArticle?mini=true&url={url}&title={title}&summary={text}&source={url}',
        gplus: 'https://plus.google.com/share?url={url}',
        email: 'mailto:?subject={title}&body={url}%0A%0A{text}'
    };
    var extend = function (obj, src) {
        for (var key in src) {
            if (src.hasOwnProperty(key)) obj[key] = src[key];
        }
        return obj;
    };
    var link = function (network) {
        var url = templates[network];
        url = url.replace('{url}', encodeURIComponent(options.url));
        url = url.replace('{title}', encodeURIComponent(options.title));
        url = url.replace('{text}', encodeURIComponent(options.text));
        url = url.replace('{image}', encodeURIComponent(options.image));
        return url;
    };
    var openPopup = function (e) {
        e = (e ? e : window.event);
        var t = (e.currentTarget);
        var
            px = Math.floor(((screen.availWidth || 1366) - options.width) / 2),
            py = Math.floor(((screen.availHeight || 700) - options.height) / 2);

        // open popup
        var popup = window.open(t.getAttribute('href'), "social",
            "width=" + options.width + ",height=" + options.height +
            ",left=" + px + ",top=" + py +
            ",location=0,menubar=0,toolbar=0,status=0,scrollbars=1,resizable=1");
        if (popup) {
            popup.focus();
            if (e.preventDefault) e.preventDefault();
            e.returnValue = false;
        }

        return !!popup;
    };
    var getMetaContentByName = function (name) {
        var metas = document.getElementsByTagName('meta');
        for (i = 0; i < metas.length; i++) {
            if (metas[i].getAttribute("property") == name || metas[i].getAttribute("name") == name) {
                return metas[i].getAttribute("content");
            }
        }

    };
    var createIcon = function (service) {
        if (services.indexOf(service) > -1) {
            var icon = document.createElement('a');
            icon.className = "sshb-" + service + " sshb-icon-container";
            icon.href = link(service);
            icon.addEventListener('click', openPopup, false);
            icon.insertAdjacentHTML('afterbegin', '<div class="' + service + '-icon sshb-icon"></div><div class="' + service + ' sshb-counter"><span>0</span></div>');
            if (service !== 'email') getCounters[service](icon);
            return icon;
        } else return false;
    };
    var getCounters = {
        "facebook": function (icon) {
            jsonp('https://api.facebook.com/method/links.getStats?urls=' + options.url + '&format=json', function (data) {
                icon.querySelectorAll('span')[0].textContent = data[0].share_count
            });
        },
        "twitter": function (icon) {
            jsonp('https://cdn.api.twitter.com/1/urls/count.json?url=' + options.url.substr(options.url.indexOf('://') + 3), function (data) {
                icon.querySelectorAll('span')[0].textContent = data.count;
            });
        },
        "gplus": function (icon) {
            var params = JSON.stringify({
                "method": "pos.plusones.get",
                "id": options.url,
                "params": {
                    "nolog": true,
                    "id": options.url,
                    "source": "widget",
                    "userId": "@viewer",
                    "groupId": "@self"
                },
                "jsonrpc": "2.0",
                "key": "p",
                "apiVersion": "v1"
            });
            var request = rq('https://clients6.google.com/rpc', 'xhr', 'POST', params);
            request.then(
                function (data, xhr) {
                    icon.querySelectorAll('span')[0].textContent = data.result.metadata.globalCounts.count;
                },
                function (data, xhr) {
                    console.error(data, xhr.status)
                }
            );
        },
        "linkedin": function (icon) {
            jsonp('https://www.linkedin.com/countserv/count/share?url=' + options.url, function (data) {
                icon.querySelectorAll('span')[0].textContent = data.count;
            });
        },
        "pinterest": function (icon) {
            jsonp('https://api.pinterest.com/v1/urls/count.json?url=' + options.url, function (data) {
                icon.querySelectorAll('span')[0].textContent = data.count;
            });
        },
        "vk": function (icon) {
            if (window.VK === undefined) {
                VK = {};
            }
            VK.Share = {
                count: function (idx, value) {
                    icon.querySelectorAll('span')[0].textContent = value;
                }
            };
            jsonp('https://vk.com/share.php?url=' + options.url + '&act=count&index=0');
        }
    };
    var img = getMetaContentByName('og:image');
    if (!img) {
        document.querySelectorAll('img').length ? img = document.querySelectorAll('img')[0].src : img = 'https://placehold.it/350x150';
    }
    var descr = getMetaContentByName('description');
    if (!descr) descr = 'https://github.com/michaeleparkour/Super-Simple-Share-Buttons/'
    var optionsDef = {
        url: location.href,
        title: document.title,
        image: img,
        text: descr,
        width: 512,
        height: 512,
        services: ['facebook', 'gplus']
    };
    var checkSize = function () {
        var icons = document.querySelectorAll('.sshb-icon-container');
        if (window.innerWidth < 801) {
            if (icons.length) {
                for (i = 0; i < icons.length; i++) {
                    icons[i].style.width = Math.min(document.documentElement.clientWidth, window.innerWidth || 0) / icons.length + 'px';
                }
            }
        } else {
            if (icons.length) {
                for (i = 0; i < icons.length; i++) {
                    icons[i].style.width = 100 + '%';
                }
            }
        }
    };
    var createStyle = function () {
        var sheet = document.createElement('style');
        sheet.innerHTML = ".sshb-share-container{position:fixed;left:0;top:20%;z-index:100000000}.sshb-share-container .sshb-share-wrapper{width:50px;position:relative;background-color:#fff}.sshb-share-container .sshb-icon-container{width:100%;height:65px;cursor:pointer;display:block;outline:0;text-decoration:none;text-transform:none;opacity:.9}.sshb-share-container .sshb-icon-container:hover{opacity:1}.sshb-share-container .sshb-icon-container .sshb-icon{height:60%;width:100%;background-position:center;background-size:contain;background-repeat:no-repeat}.sshb-share-container .sshb-icon-container .sshb-counter{width:auto;text-align:center;color:#f0f8ff;font-family:Arial,sans-serif;font-size:14px;line-height:1;padding:0 5px}.sshb-share-container .sshb-icon-container.sshb-facebook{background-color:#3b5998}.sshb-share-container .sshb-icon-container.sshb-facebook .sshb-icon{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI2MHB4IiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA2MCA2MCIgd2lkdGg9IjYwcHgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgaWQ9InNvaWNhbCIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiPjxnIGlkPSJzb2NpYWwiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yNzMuMDAwMDAwLCAtMTM4LjAwMDAwMCkiPjxnIGZpbGw9IiNGRkZGRkYiIGlkPSJpY29uIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxODIuMDAwMDAwLCAxNTAuMDAwMDAwKSI+PHBhdGggZD0iTTExNi40NjIyMjQsMzUuMzE0MzEzIEwxMTYuNDYyMjI0LDE3Ljk5ODk2MTMgTDExMi45NDMyODksMTcuOTk4OTYxMiBMMTEyLjk0MzI4OSwxMi4yNTkzNTYzIEwxMTYuNDYyMjI0LDEyLjI1OTM1NjMgTDExNi40NjIyMjQsOC43ODgzODY0MSBDMTE2LjQ2MjIyNCw0LjEwNjY0MjIyIDExNy44NjE5OTUsMC43MzA2MTg5ODYgMTIyLjk4ODEwMiwwLjczMDYxODk4NiBMMTI5LjA4NjM2LDAuNzMwNjE4OTg2IEwxMjkuMDg2MzYsNi40NTg0Mzk5NiBMMTI0Ljc5MjI1NSw2LjQ1ODQzOTk2IEMxMjIuNjQxODk0LDYuNDU4NDM5OTYgMTIyLjE1MTg3NCw3Ljg4NzM3NjMgMTIyLjE1MTg3NCw5LjM4Mzc2MDk1IEwxMjIuMTUxODc0LDEyLjI1OTM1NTMgTDEyOC43Njk0MjMsMTIuMjU5MzU1OCBMMTI3Ljg2NjE3MywxNy45OTg5NjEzIEwxMjIuMTUxODc0LDE3Ljk5ODk2MTMgTDEyMi4xNTE4NzQsMzUuMzE0MzEyMyBMMTE2LjQ2MjIyNCwzNS4zMTQzMTMgWiIgaWQ9ImZhY2Vib29rIi8+PC9nPjwvZz48L2c+PC9zdmc+)}.sshb-share-container .sshb-icon-container.sshb-twitter{background-color:#2ba9e1}.sshb-share-container .sshb-icon-container.sshb-twitter .sshb-icon{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBoZWlnaHQ9IjYwcHgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDYwIDYwIiB3aWR0aD0iNjBweCI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBpZD0ic29pY2FsIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSI+PGcgaWQ9InNvY2lhbCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3My4wMDAwMDAsIC0xMzguMDAwMDAwKSI+PGcgZmlsbD0iI0ZGRkZGRiIgaWQ9Imljb24iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE4Mi4wMDAwMDAsIDE1MC4wMDAwMDApIj48cGF0aCBkPSJNMzIuMDUyMTM4NSw2LjQzNjY5NDI3IEMzMC44NDMxODQ2LDUuMDYyMjAxNSAyOS4xMjA1Mzg1LDQuMTg2NDY0MSAyNy4yMTQwNjE1LDQuMTU0NzMxMDMgQzIzLjU1MzYsNC4wOTM4MDMwOSAyMC41ODU2NTM4LDcuMTg2OTIzMzkgMjAuNTg1NjUzOCwxMS4wNjMxMTYgQzIwLjU4NTY1MzgsMTEuNjEzMjQxMiAyMC42NDQyOTIzLDEyLjE0OTY5MzQgMjAuNzU3MzY5MiwxMi42NjQ2NzMyIEMxNS4yNDg1ODQ2LDEyLjMwNzM1MjYgMTAuMzY0NDY5Miw5LjQzODc3MDU5IDcuMDk1NDE1MzgsNS4xMTQ3MjE4IEM2LjUyNDg2MTU0LDYuMTUwODYxNyA2LjE5NzkwNzY5LDcuMzYxODgyNzEgNi4xOTc5MDc2OSw4LjY1OTE1MDM3IEM2LjE5NzkwNzY5LDExLjExNDk4ODQgNy4zNjgwOTIzMSwxMy4yOTQ1MjcyIDkuMTQ2NjMwNzcsMTQuNTgxNDE3NCBDOC4wNjAxMjMwOCwxNC41MzM0NDk5IDcuMDM4MDY5MjMsMTQuMjA0NTM3OCA2LjE0NDQzODQ2LDEzLjY2NDk1MiBDNi4xNDM3OTIzMSwxMy42OTQ0NDUgNi4xNDM3OTIzMSwxMy43MjM5NDQ5IDYuMTQzNzkyMzEsMTMuNzUzOTYyNSBDNi4xNDM3OTIzMSwxNy4xODM1NDk3IDguNDI4NTkyMzEsMjAuMDYwNzA3NiAxMS40NjA4MzA4LDIwLjczMDkzODMgQzEwLjkwNDY1MzgsMjAuODg4NTM4IDEwLjMxOTA3NjksMjAuOTcxMDE2MyA5LjcxNDYsMjAuOTY3MDA4IEM5LjI4NzQ5MjMxLDIwLjk2NDE3NTggOC44NzIxNzY5MiwyMC45MTY4MTE4IDguNDY3NTIzMDgsMjAuODMxNzY4IEM5LjMxMDkxNTM4LDIzLjY0NDM3NzcgMTEuNzU4NzA3NywyNS42OTY3NjYzIDE0LjY1OTI5MjMsMjUuNzY0NjI4IEMxMi4zOTA4MDc3LDI3LjY0NzY5NjMgOS41MzI4NjkyMywyOC43NjkxOTMzIDYuNDI3MjkyMzEsMjguNzYyNzg3IEM1Ljg5MjI3NjkyLDI4Ljc2MTY4MzMgNS4zNjQ2OTIzMSwyOC43MjcxMTIgNC44NDYxNTM4NSwyOC42NjA1OTk2IEM3Ljc3OTUzMDc3LDMwLjY3MzMxMzkgMTEuMjYzNTkyMywzMS44NDUxNzExIDE1LjAwNjc2MTUsMzEuODQ2MTUzMSBDMjcuMTk4NTUzOCwzMS44NDkzNTE4IDMzLjg2NTczMDgsMjEuMjM5NTEwOSAzMy44NjU3MzA4LDEyLjAzNjc2ODcgQzMzLjg2NTczMDgsMTEuNzM0ODM2MyAzMy44NTkxMDc3LDExLjQzNDUxOTEgMzMuODQ2NTA3NywxMS4xMzU2NTIgQzM1LjE0MTU2MTUsMTAuMTcwNjY2NSAzNi4yNjUyMjMxLDguOTYwNzg5MTUgMzcuMTUzODQ2Miw3LjU3OTIxOTAxIEMzNS45NjUyNDYyLDguMTE1MDE2MTUgMzQuNjg3NjM4NSw4LjQ3MDg2ODYzIDMzLjM0NzAzMDgsOC42MjAxMzc4OSBDMzQuNzE1NDIzMSw3Ljc3Nzk2NTE4IDM1Ljc2NjU1MzgsNi40MzAwOTYwNyAzNi4yNjEzNDYyLDQuODEzNzU4NCBDMzQuOTgwNTA3Nyw1LjU5MDQ5MjI5IDMzLjU2MjAzODUsNi4xNDc1MTI4NiAzMi4wNTIxMzg1LDYuNDM2Njk0MjcgWiIgaWQ9InR3aXR0ZXIiLz48L2c+PC9nPjwvZz48L3N2Zz4=)}.sshb-share-container .sshb-icon-container.sshb-gplus{background-color:#dd4b39}.sshb-share-container .sshb-icon-container.sshb-gplus .sshb-icon{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBoZWlnaHQ9IjYwcHgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDYwIDYwIiB3aWR0aD0iNjBweCI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBpZD0ic29pY2FsIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSI+PGcgaWQ9InNvY2lhbCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQ3My4wMDAwMDAsIC0xMzguMDAwMDAwKSI+PGcgZmlsbD0iI0ZGRkZGRiIgaWQ9Imljb24iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE4Mi4wMDAwMDAsIDE1MC4wMDAwMDApIj48cGF0aCBkPSJNMzM0LjEyNTIxNCwxNi41NTc0MDEyIEwzMzQuMTI1MjE0LDEyLjk0ODg1ODUgTDMzMS41NTIzMTYsMTIuOTQ4ODU4NSBMMzMxLjU1MjMxNiwxNi41NTc0MDEyIEwzMjcuODQ3MzQxLDE2LjU1NzQwMTIgTDMyNy44NDczNDEsMTkuMTM0OTMxNyBMMzMxLjU1MjMxNiwxOS4xMzQ5MzE3IEwzMzEuNTUyMzE2LDIyLjg0NjU3NTYgTDMzNC4xMjUyMTQsMjIuODQ2NTc1NiBMMzM0LjEyNTIxNCwxOS4xMzQ5MzE3IEwzMzcuNzI3MjczLDE5LjEzNDkzMTcgTDMzNy43MjcyNzMsMTYuNTU3NDAxMiBMMzM0LjEyNTIxNCwxNi41NTc0MDEyIFogTTMxNS4zOTQ1MTEsMTYuMzUxMTk4OCBMMzE1LjM5NDUxMSwyMC40NzUyNDc1IEMzMTUuMzk0NTExLDIwLjQ3NTI0NzUgMzE5LjM4ODA2MiwyMC40Njk4ODYzIDMyMS4wMTQxMzQsMjAuNDY5ODg2MyBDMzIwLjEzMzU4NSwyMy4xNDM0MDQgMzE4Ljc2NDM5MSwyNC41OTkyOTYzIDMxNS4zOTQ1MTEsMjQuNTk5Mjk2MyBDMzExLjk4NDE4NSwyNC41OTkyOTYzIDMwOS4zMjI0NywyMS44Mjk2ODgyIDMwOS4zMjI0NywxOC40MTMyMjMxIEMzMDkuMzIyNDcsMTQuOTk2NzU4IDMxMS45ODQxODUsMTIuMjI3MTUgMzE1LjM5NDUxMSwxMi4yMjcxNSBDMzE3LjE5NzU5OSwxMi4yMjcxNSAzMTguMzYyMDkzLDEyLjg2MjA0NzMgMzE5LjQzMDI1NywxMy43NDY5NjUxIEMzMjAuMjg1MjgzLDEyLjg5MDQwMDEgMzIwLjIxMzg1OSwxMi43NjgzMjgzIDMyMi4zODkxOTQsMTAuNzEwMzI0OSBDMzIwLjU0MjU3Myw5LjAyNjQ3NTc0IDMxOC4wODgyMzMsOCAzMTUuMzk0NTExLDggQzMwOS42NTM3NTYsOCAzMDUsMTIuNjYyMTM0IDMwNSwxOC40MTMyMjMxIEMzMDUsMjQuMTY0MjA5MSAzMDkuNjUzNzU2LDI4LjgyNjQ0NjMgMzE1LjM5NDUxMSwyOC44MjY0NDYzIEMzMjMuOTc1MzM0LDI4LjgyNjQ0NjMgMzI2LjA3MjY1OSwyMS4zNDEyOTc4IDMyNS4zNzczNTgsMTYuMzUxMTk4OCBMMzE1LjM5NDUxMSwxNi4zNTExOTg4IFoiIGlkPSJnb29nbGVfcGx1cyIvPjwvZz48L2c+PC9nPjwvc3ZnPg==)}.sshb-share-container .sshb-icon-container.sshb-linkedin{background-color:#007bb6}.sshb-share-container .sshb-icon-container.sshb-linkedin .sshb-icon{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBoZWlnaHQ9IjYwcHgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDYwIDYwIiB3aWR0aD0iNjBweCI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBpZD0ic29pY2FsIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSI+PGcgaWQ9InNvY2lhbCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTc3My4wMDAwMDAsIC0xMzguMDAwMDAwKSI+PGcgZmlsbD0iI0ZGRkZGRiIgaWQ9Imljb24iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE4Mi4wMDAwMDAsIDE1MC4wMDAwMDApIj48cGF0aCBkPSJNNjEyLjg4MzA3NSwzMS44MjMxNTEyIEw2MTIuODgzMDc1LDEzLjUyNDMzODkgTDYwNy4yMjczNywxMy41MjQzMzg5IEw2MDcuMjI3MzcsMzEuODIzMTUxMiBMNjEyLjg4MzA3NSwzMS44MjMxNTEyIFogTTYxMi44ODMwNzUsNy4wMzgyMTQ1NSBDNjEyLjg0OTM4OCw1LjQwMDY1OTk2IDYxMS43NTgwMTYsNC4xNTM4NDYxNSA2MDkuOTg1MDU0LDQuMTUzODQ2MTUgQzYwOC4yMTE2MzIsNC4xNTM4NDYxNSA2MDcuMDUyODg1LDUuNDAwNjU5OTYgNjA3LjA1Mjg4NSw3LjAzODIxNDU1IEM2MDcuMDUyODg1LDguNjQwMjAyMzQgNjA4LjE3Nzk0NCw5LjkyMzA3NjkyIDYwOS45MTcyMTksOS45MjMwNzY5MiBMNjA5Ljk1MDkwNiw5LjkyMzA3NjkyIEM2MTEuNzU4MDE2LDkuOTIzMDc2OTIgNjEyLjg4MzA3NSw4LjY0MDIwMjM0IDYxMi44ODMwNzUsNy4wMzgyMTQ1NSBaIE02MjIuMTEwMDQyLDMxLjgyMzE1MTcgTDYyMi4xMTAwNDIsMjEuMzk3MzcyOSBDNjIyLjExMDA0MiwyMC44Mzk0MDE0IDYyMi4xNTAzNywyMC4yODE0MyA2MjIuMzE0NDQ3LDE5Ljg4MzY2ODIgQzYyMi43NjMwMzQsMTguNzY4Mjc3OCA2MjMuNzgzOTU2LDE3LjYxMzY2MzcgNjI1LjQ5ODE5OSwxNy42MTM2NjM3IEM2MjcuNzQzODk2LDE3LjYxMzY2MzcgNjI5LjE1MjI3OCwxOC44ODgxNTg3IDYyOS4xNTIyNzgsMjEuMzk3MzcyNyBMNjI5LjE1MjI3OCwzMS44MjMxNTE2IEw2MzQuODQ2MTU0LDMxLjgyMzE1MTcgTDYzNC44NDYxNTQsMjEuMTE4Mzg3MiBDNjM0Ljg0NjE1NCwxNS4zODM5ODc4IDYzMS43ODUwNDUsMTIuNzE1NjY5IDYyNy43MDE5MSwxMi43MTU2NjkgQzYyNC4zNTQwODEsMTIuNzE1NjY5IDYyMi44ODQ1NzIsMTQuNTg3MzU5MyA2MjIuMDY4NjA4LDE1Ljg2MTMwMiBMNjIyLjEwOTQ4OSwxMy40MTM5MTIzIEw2MTYuNDI1NDYyLDEzLjQxMzkxMjMgQzYxNi41MDcyMjQsMTUuMTY1NzIxNSA2MTYuNDI1NDYyLDMxLjgyMzE1MTYgNjE2LjQyNTQ2MiwzMS44MjMxNTE2IEw2MjIuMTEwMDQyLDMxLjgyMzE1MTcgWiIgaWQ9ImxpbmtlZGluIi8+PC9nPjwvZz48L2c+PC9zdmc+)}.sshb-share-container .sshb-icon-container.sshb-vk{background-color:#356396}.sshb-share-container .sshb-icon-container.sshb-vk .sshb-icon{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBoZWlnaHQ9IjQzLjM0OTJtbSIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgNDMzNSA0MzM1IiB3aWR0aD0iNDMuMzQ5Mm1tIiB4bWw6c3BhY2U9InByZXNlcnZlIj48Zz48ZyBmaWxsPSIjRkZGRkZGIj48cGF0aCBkPSJNMjk2MCAyNTQyYzAsOTcgLTE4LDE4MiAtNTUsMjU2IC0zNyw3MyAtODYsMTM0IC0xNDgsMTgyIC03NCw1NyAtMTU1LDk5IC0yNDIsMTIzIC04OCwyNSAtMjAwLDM3IC0zMzYsMzdsLTc4MyAwIDAgLTE5NTQgNjkxIDBjMTQ0LDAgMjUzLDUgMzI2LDE3IDc0LDExIDE0NCwzNCAyMDksNjkgNzAsMzggMTIyLDg4IDE1NywxNTEgMzUsNjMgNTIsMTM2IDUyLDIxOCAwLDk1IC0yNCwxODAgLTcyLDI1NCAtNDcsNzQgLTExNCwxMjkgLTE5OCwxNjRsMCAxMWMxMjEsMjYgMjE3LDc3IDI4OSwxNTUgNzMsNzggMTA5LDE4NCAxMDksMzE3em0tNjI5IC04MDRjMCwtMzEgLTgsLTY0IC0yNCwtOTcgLTE2LC0zMyAtNDEsLTU3IC03NiwtNzIgLTMyLC0xNCAtNzAsLTIyIC0xMTUsLTIzIC00NCwtMSAtMTEwLC0yIC0xOTgsLTJsLTM0IDAgMCA0MTQgNjIgMGM4NCwwIDE0MiwtMSAxNzYsLTMgMzQsLTIgNjgsLTExIDEwNCwtMjggMzksLTE4IDY2LC00MyA4MSwtNzYgMTUsLTMyIDIyLC03MCAyMiwtMTEzem0xMjQgNzk2YzAsLTYxIC0xMiwtMTA3IC0zNywtMTQyIC0yNSwtMzQgLTYxLC02MCAtMTEwLC03NyAtMzAsLTEyIC03MSwtMTggLTEyMywtMTkgLTUyLC0xIC0xMjIsLTIgLTIxMCwtMmwtOTAgMCAwIDQ4OSAyNiAwYzEyOCwwIDIxNiwtMSAyNjUsLTMgNDksLTIgOTksLTEzIDE1MCwtMzUgNDQsLTE5IDc3LC00NyA5OCwtODUgMjEsLTM3IDMxLC03OSAzMSwtMTI2eiIvPjwvZz48L2c+PC9zdmc+)}.sshb-share-container .sshb-icon-container.sshb-email{background-color:#939598}.sshb-share-container .sshb-icon-container.sshb-email .sshb-icon{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBoZWlnaHQ9IjYwcHgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDYwIDYwIiB3aWR0aD0iNjBweCI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTg3My4wMDAwMDAsIC02MzguMDAwMDAwKSI+PGcgZmlsbD0iI0ZGRkZGRiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTgyLjAwMDAwMCwgMTUwLjAwMDAwMCkiPjxwYXRoIGQ9Ik03MjEsNTIxLjQ2MTUzOCBMNzM4LjMwNzY5Miw1MDYuNDYxNTM4IEw3MDMuNjkyMzA4LDUwNi40NjE1MzggTDcyMSw1MjEuNDYxNTM4IFogTTcxNi4zMjUxNzcsNTE5LjgwMTA1NCBMNzIxLDUyMy42MzgyNCBMNzI1LjYwMTU4MSw1MTkuODAxMDU0IEw3MzguMzA3NjkyLDUzMC42OTIzMDggTDcwMy42OTIzMDgsNTMwLjY5MjMwOCBMNzE2LjMyNTE3Nyw1MTkuODAxMDU0IFogTTcwMi41Mzg0NjIsNTI5LjUzODQ2MiBMNzAyLjUzODQ2Miw1MDcuNjE1Mzg1IEw3MTUuMjMwNzY5LDUxOC41NzY5MjMgTDcwMi41Mzg0NjIsNTI5LjUzODQ2MiBaIE03MzkuNDYxNTM4LDUyOS41Mzg0NjIgTDczOS40NjE1MzgsNTA3LjYxNTM4NSBMNzI2Ljc2OTIzMSw1MTguNTc2OTIzIEw3MzkuNDYxNTM4LDUyOS41Mzg0NjIgWiIgaWQ9Im1haWwiLz48L2c+PC9nPjwvZz48L3N2Zz4=)}.sshb-share-container .sshb-icon-container.sshb-pinterest{background-color:#cb2027}.sshb-share-container .sshb-icon-container.sshb-pinterest .sshb-icon{background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBoZWlnaHQ9IjYwcHgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDYwIDYwIiB3aWR0aD0iNjBweCI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTY3My4wMDAwMDAsIC0xMzguMDAwMDAwKSI+PGcgZmlsbD0iI0ZGRkZGRiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTgyLjAwMDAwMCwgMTUwLjAwMDAwMCkiPjxwYXRoIGQ9Ik01MjMuNzU5NDUzLDI3LjA4NDQwMTEgQzUzMC4zNjUwNjEsMjcuMDg0NDAxMSA1MzQuODQ2MTU0LDIwLjkzNzA0OTMgNTM0Ljg0NjE1NCwxMi43MDgzMTA2IEM1MzQuODQ2MTU0LDYuNDg3OTAxMjUgNTI5LjY4MzI5NiwwLjY5MjMwNzY5MiA1MjEuODM4NzMyLDAuNjkyMzA3NjkyIEM1MTIuMDc2MzkzLDAuNjkyMzA3NjkyIDUwNy4xNTM4NDYsNy44Mzc1MTA2IDUwNy4xNTM4NDYsMTMuNzk1NzU0OCBDNTA3LjE1Mzg0NiwxNy40MDM1MzIxIDUwOC40OTA4NzEsMjAuNjEzMjUxMyA1MTEuMzYxNjQ0LDIxLjgwOTUzMDEgQzUxMS44MzE5NTksMjIuMDA1NTUyNiA1MTIuMjUzMzg3LDIxLjgxNTg0MzcgNTEyLjM5MDMyOSwyMS4yODQ1OTg1IEM1MTIuNDgzOTc5LDIwLjkxNjMwNDYgNTEyLjcxMDQ0OSwxOS45ODczMDE5IDUxMi44MDg4MTEsMTkuNjAwOTY5MSBDNTEyLjk0NjYzNywxOS4wNzQ4MzQ5IDUxMi44OTM2MjcsMTguODkwNTM3NiA1MTIuNTEzNzI0LDE4LjQzMTc0ODYgQzUxMS42ODY3NzEsMTcuNDM0MTk4MiA1MTEuMTU5MDI5LDE2LjE0NTMxOTcgNTExLjE1OTAyOSwxNC4zMTc2Nzk5IEM1MTEuMTU5MDI5LDkuMDE3MjUzNzcgNTE1LjA0MTk5Niw0LjI3MjEyNDcgNTIxLjI3NDc2Nyw0LjI3MjEyNDcgQzUyNi43OTEwMjQsNC4yNzIxMjQ3IDUyOS44MjQwNjYsNy43MTMwNDIyOSA1MjkuODI0MDY2LDEyLjMxMDU1MzEgQzUyOS44MjQwNjYsMTguMzU4MzkwNSA1MjcuMjAyNDM4LDIzLjQ2Mjc5NCA1MjMuMzA5NDU5LDIzLjQ2Mjc5NCBDNTIxLjE1OTAyOSwyMy40NjI3OTQgNTE5LjU1MTM2MSwyMS42NDgwODIgNTIwLjA2NjE0NCwxOS40MjI2ODQ4IEM1MjAuNjgyNTMsMTYuNzY1NTU2OCA1MjEuODgwNTUxLDEzLjg5Njc3MjYgNTIxLjg4MDU1MSwxMS45Nzg2Mzc2IEM1MjEuODgwNTUxLDEwLjI2MjUzODIgNTIwLjk3NzkxMyw4LjgyOTM0ODcxIDUxOS4xMDkwMjMsOC44MjkzNDg3MSBDNTE2LjkxMTE3OSw4LjgyOTM0ODcxIDUxNS4xNDYyNDgsMTEuMTUwOTUzNCA1MTUuMTQ2MjQ4LDE0LjI1OTM1NDIgQzUxNS4xNDYyNDgsMTYuMjM5MTIyIDUxNS44MDI2ODYsMTcuNTc4NTA5MyA1MTUuODAyNjg2LDE3LjU3ODUwOTMgQzUxNS44MDI2ODYsMTcuNTc4NTA5MyA1MTMuNTUzNTk5LDI3LjMwNTM3NzUgNTEzLjE1ODY3NiwyOS4wMDgyNDg0IEM1MTIuODAwNTY1LDMwLjU1ODk5MTMgNTEyLjc0Njk2NywzMi4yNjMzNjU0IDUxMi43OTczMjYsMzMuNzAzNzcwNSBDNTEyLjk0NzgxNSwzNC45OTU5NTYxIDUxNC4xOTk0MzUsMzYuMDQ4MjI0NCA1MTUuMjg1MjUyLDM0LjYzMDY2ODYgQzUxNi4wNDg1OTIsMzMuMzg1MDgzNSA1MTYuODY5MzYsMzEuODEyMDkyNiA1MTcuMjk0MDI4LDMwLjIzNTQ5MzkgQzUxNy41NDcyOTcsMjkuMzAyNTgyOCA1MTguNzQwMDE2LDI0LjQ2OTk2NTIgNTE4Ljc0MDAxNiwyNC40Njk5NjUyIEM1MTkuNDU0NzY1LDI1Ljg2MDE2MiA1MjEuNTQxMjg5LDI3LjA4NDQwMTEgNTIzLjc1OTQ1MywyNy4wODQ0MDExIFoiIGlkPSJwaW50ZXJlc3QiLz48L2c+PC9nPjwvZz48L3N2Zz4=)}@media screen and (max-width:800px){.sshb-share-container{top:auto;bottom:0}.sshb-share-container .sshb-share-wrapper{width:auto}.sshb-share-container .sshb-icon-container{float:left}}";
        document.body.appendChild(sheet);
    };
    options = extend(optionsDef, options);
    if (options.services.length > 0) {
        var exists = document.querySelector('.sshb-share-container');
        exists && exists.parentNode.removeChild(exists);
        var shareContainer = document.createElement('div');
        shareContainer.className = "sshb-share-container";
        var shareWrapper = document.createElement('div');
        shareWrapper.className = 'sshb-share-wrapper';
        shareContainer.appendChild(shareWrapper);
        options.services.forEach(function (service) {
            var icon = createIcon(service);
            icon && shareWrapper.appendChild(icon);
        });
        document.body.appendChild(shareContainer);
        createStyle();
        checkSize();
        window.addEventListener('resize', checkSize, false);
    } else {
        return false;
    }
}
