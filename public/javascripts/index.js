function addLoadEvent(newFunc) {
    var func = window.onload;

    if (typeof func !== 'function') {
        window.onload = newFunc;
    } else {
        window.onload = function() {
            func();
            newFunc();
        };
    }
}

function HiChat() {
    this.socket = null;
}

HiChat.prototype = {
    init: function() {
        var that = this;

        // socket 连接
        this.socket = io.connect();
        this.socket.on('connect', function() {
            document.getElementById('info').textContent = 'get yourself a nickname :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });

        // 登陆
        document.getElementById('loginBtn').addEventListener('click', function() {
            var nicknameInput = document.getElementById('nicknameInput');
            var nickName = nicknameInput.value;

            if (nickName.trim().length !== 0) {
                that.socket.emit('login', nickName);
            } else {
                nicknameInput.focus();
            }
        }, false);

        this.socket.on('nickExisted', function() {
            document.getElementById('info').textContent = '!nickname is taken, choose another pls';
        });

        this.socket.on('loginSuccess', function() {
            document.title = 'chat-room | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
        });

        // 在线统计
        this.socket.on('system', function(nickName, userCount, type) {
            var msg = nickName + (type === 'login' ? ' 进入聊天室' : ' 离开聊天室');

            that._displayNewMsg('system', msg, '#E89898');

            document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users ' : ' user ') + 'online';
        });

        // 消息发送
        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;

            messageInput.value = '';
            messageInput.focus();

            if (msg.trim().length !== 0) {
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
            }
        });


        // 接受消息
        this.socket.on('newMsg', function(user, msg, color) {
            that._displayNewMsg(user, msg, color);
        });

        // 发送图片
        document.getElementById('sendImage').addEventListener('change', function() {
            if (this.files.length !== 0) {
                var file = this.files[0],
                    reader = new FileReader(),
                    color = document.getElementById('colorStyle').value;

                if (!reader) {
                    that._displayNewMsg('system', '!you browser doesn\'t support FileReader', '#E89898');
                    this.value = '';
                    return;
                }

                reader.onload = function(event) {
                    that.socket.emit('img', event.target.result, color);
                    that._displayImage('me', event.target.result, color);

                    this.value = '';
                }.bind(this);

                reader.readAsDataURL(file);
            }
        }, false);

        // 接受图片
        this.socket.on('newImg', function(user, imageData, color) {
            that._displayImage(user, imageData, color);
        });

        // 显示表情
        this._initialEmoji();
        document.getElementById('emoji').addEventListener('click', function(event) {
            var emojiWrapper = document.getElementById('emojiWrapper');

            emojiWrapper.style.display = 'block';
            event.stopPropagation();
        }, false);
        document.body.addEventListener('click', function(event) {
            var emojiWrapper = document.getElementById('emojiWrapper');

            if (event.target !== emojiWrapper) {
                emojiWrapper.style.display = 'none'
            }
        }, false);
        document.getElementById('emojiWrapper').addEventListener('click', function(event) {
            var target = event.target;

            if (target.nodeName.toLowerCase() === 'img') {
                var messageInput = document.getElementById('messageInput');

                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            }
        }, false);

        // 增加按键操作
        document.getElementById('nicknameInput').addEventListener('keyup', function(event) {
            if (event.keyCode === 13) {
                var nickName = document.getElementById('nicknameInput').value;

                if (nickName.trim().length !== 0) {
                    that.socket.emit('login', nickName);
                }
            }
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function(event) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;

            if (event.keyCode === 13 && msg.trim().length !== 0) {
                messageInput.value = '';

                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
            }
        }, false);

        // 清除消息面板内容
        document.getElementById('clearBtn').addEventListener('click', function() {
            document.getElementById('historyMsg').innerHTML = '';
        }, false);
    },

    // 显示消息
    _displayNewMsg: function(user, msg, color) {
        var historyMsg = document.getElementById('historyMsg'),
            p = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);

        msg = this._showEmoji(msg);

        p.style.color = color || '#000';
        p.innerHTML = user + ' (' + date + ') ' + msg;

        historyMsg.appendChild(p);
        historyMsg.scrollTop = historyMsg.scrollHeight;
    },

    // 显示图片
    _displayImage: function(user, imageData, color) {
        var historyMsg = document.getElementById('historyMsg'),
            p = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);

        p.style.color = color || '#000';
        p.innerHTML = user + ' (' + date + ') ' + '<br>' + '<a href="' + imageData + '" target="_blank"><img src="' + imageData + '"></a>';

        historyMsg.appendChild(p);
        historyMsg.scrollTop = historyMsg.scrollHeight;
    },

    // 初始化表情图片
    _initialEmoji: function() {
        var emojiWrapper = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();

        for (var i = 69; i > 0; i--) {
            var emoji = document.createElement('img');

            emoji.src = 'content/emoji/' + i + '.gif';
            emoji.title = i;
            docFragment.appendChild(emoji);
        }

        emojiWrapper.appendChild(docFragment);
    },

    _showEmoji: function(msg) {
        var result = msg,
            reg = /\[emoji:\d+\]/g,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length,
            match,
            emojiIndex;

        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);

            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img src="content/emoji/' + emojiIndex + '.gif">');
            }
        }

        return result;
    }
};

var hiChat = new HiChat();

addLoadEvent(function() {
    hiChat.init();
});
