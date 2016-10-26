(function(window, document, chrome) {
    'use strict';
    var active = true, linkSubmit;

    var actionButton, actionLogo, actionArrow, actionIcon, actionTextInactive, actionTextActive, actionDelete, actionActive, actionDown;
    var linkContainer, linkView, linkArrow, linkInput, linkDelete;
    var selectContainer, canvas, ctx, divSelection, loader, loaderProgress;
    var x, y, w, h;

    var origin, down;
    function transformHorizontal(i) {
        return i * canvas.width / selectContainer.offsetWidth;
    }
    function transformVertical(i) {
        return i * canvas.height / selectContainer.offsetHeight;
    }
    function transformSelection(i, transform) {
        if (typeof transform !== 'undefined' && transform[1] === true) {    
            return [i - transform[0], null];
        }
        if (i < 0) {
            return [-i, true];
            }
        return [i, false];
    }
    function drawRectangleSelection(coords) {
        w = transformSelection(coords[0] - origin[0]);
        h = transformSelection(coords[1] - origin[1]);
        x = transformSelection(origin[0], w)[0];
        y = transformSelection(origin[1], h)[0];
        w = w[0];
        h = h[0];
        if (w === 0 || h === 0) {
            actionButton.className = '';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return false;
        }
        divSelection.style.width = w + 'px';
        divSelection.style.height = h + 'px';
        divSelection.style.left = x + 'px';
        divSelection.style.top = y + 'px';

        chrome.runtime.sendMessage({message: 'capture', W: canvas.width, H: canvas.height, x: x, y: y, w: w, h: h}, function(response) {
            divSelection.style.backgroundImage ='url(' + response.data + ')';
            actionButton.className = 'itso_action_active';
            actionActive = true;
            window.setTimeout(function() {
                divSelection.className = 'itso_div_select_hide';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }, 0);
        });
    }
    function drawRectangle(coords) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, .4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        x = transformHorizontal(origin[0]);
        y = transformVertical(origin[1]);
        w = transformHorizontal(coords[0] - origin[0]);
        h = transformVertical(coords[1] - origin[1]);
        ctx.clearRect(x, y, w, h);
    }
    function position(mouseDown, e) {
        if (active === false || linkSubmit === true) return false;
        if (mouseDown === true) {
            actionDown = false;
            actionButton.className = 'itso_action_button_hide';
            divSelection.removeAttribute('style');
            divSelection.className = '';
            down = true;
            origin = [e.clientX, e.clientY];
            drawRectangle(origin);
        }
        if ((down === true && e.buttons === 0) || (down === true && mouseDown === false)) {
            down = false;
            drawRectangleSelection([e.clientX, e.clientY]);
        }
        if (down === true && mouseDown === null) {
            if (down === true) drawRectangle([e.clientX, e.clientY]);
        }
    }
    function activate() {
        active = true;
        actionButton.className = 'itso_action_pulse';
        selectContainer.className = '';
        linkContainer.className = '';
        linkSubmit = false;
        divSelection.removeAttribute('style');
        divSelection.className = '';
    }
    function deactivate() {
        active = false;
        actionActive = false;
        actionDown = false;
        linkSubmit = false;
        divSelection.removeAttribute('style');
        divSelection.className = '';
        actionButton.className = 'inactive';
        selectContainer.className = 'inactive';
        linkInput.value = '';
        linkContainer.className = '';
        loader.className = '';
    }

    function actionClick(e) {
        e.stopPropagation();
        if (linkSubmit === true) return false;
        linkSubmit = true;
        loader.className = 'itso_loader_show';
        chrome.runtime.sendMessage({message: 'upload'}, function(response) {
            if (typeof response !== 'undefined' && response.message === 'success') {
                loader.className = '';
                linkInput.value = response.ref;
                linkView.href = response.ref;
                linkContainer.className = 'itso_link_container_show';
                selectContainer.className = 'link_submit';
                window.setTimeout(function() {
                    linkInput.select();
                }, 0);
            }
        });
    }
    function actionDeleteClick(e) {
        e.stopPropagation();
        chrome.runtime.sendMessage({message: 'deactivate'});
    }
    function linkInputClick(e) {
        e.target.select();
    }
    function linkDeleteClick(e) {
        e.stopPropagation();
        chrome.runtime.sendMessage({message: 'deactivate'});
    }

    actionButton = document.createElement('div');
    actionButton.id = 'itso_action_button';
    actionButton.className = 'itso_action_pulse';
    actionLogo = document.createElement('div');
    actionLogo.id = 'itso_action_logo';
    actionArrow = document.createElement('div');
    actionArrow.id = 'itso_action_arrow';
    actionIcon = document.createElement('div');
    actionIcon.id = 'itso_action_icon';
    actionTextInactive = document.createElement('div');
    actionTextInactive.id = 'itso_action_text_inactive';
    actionTextInactive.innerHTML = 'Drag a selection!';
    actionTextActive = document.createElement('div');
    actionTextActive.id = 'itso_action_text_active';
    actionTextActive.innerHTML = 'Get the link!';
    actionDelete = document.createElement('div');
    actionDelete.id = 'itso_action_delete';
    actionButton.appendChild(actionLogo);
    actionButton.appendChild(actionArrow);
    actionButton.appendChild(actionIcon);
    actionButton.appendChild(actionTextInactive);
    actionButton.appendChild(actionTextActive);
    actionButton.appendChild(actionDelete);
    linkContainer = document.createElement('div');
    linkContainer.id = 'itso_link_container';
    linkView = document.createElement('a');
    linkView.id = 'itso_link_view';
    linkView.innerHTML = 'View';
    linkArrow = document.createElement('div');
    linkArrow.id = 'itso_link_arrow';
    linkInput = document.createElement('input');
    linkInput.id = 'itso_link_input';
    linkDelete = document.createElement('div');
    linkDelete.id = 'itso_link_delete';
    selectContainer = document.createElement('div');
    selectContainer.id = 'itso_select_container';
    loader = document.createElement('div');
    loader.id = "itso_loader";
    loaderProgress = document.createElement('div');
    loaderProgress.id = 'itso_loader_progress';
    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    ctx = canvas.getContext('2d');
    canvas.id = 'itso_canvas_select';
    divSelection = document.createElement('div');
    divSelection.id = 'itso_div_select';
    loader.appendChild(loaderProgress);
    divSelection.appendChild(loader);
    selectContainer.appendChild(canvas);
    selectContainer.appendChild(divSelection);
    linkContainer.appendChild(linkView);
    linkContainer.appendChild(linkArrow);
    linkContainer.appendChild(linkInput);
    linkContainer.appendChild(linkDelete);
    document.body.appendChild(selectContainer);
    document.body.appendChild(actionButton);
    document.body.appendChild(linkContainer);

    selectContainer.addEventListener('mousedown', position.bind(this, true), false);
    selectContainer.addEventListener('mousemove', position.bind(this, null), false);
    selectContainer.addEventListener('mouseup', position.bind(this, false), false);
    actionButton.addEventListener('click', actionClick, false);
    actionButton.addEventListener('mousedown', function(e) {
        e.stopPropagation();
        if (actionActive === true) {
            actionDown = false;
            return true;
        }
        position.call(this, true, e);
    }, false);
    actionButton.addEventListener('mouseup', function(e) {
        e.stopPropagation();
    }, false);
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message === 'status') {
            sendResponse({message: active});
        }
        if (request.message === 'deactivate') {
            sendResponse({message: 'inactive'});
            deactivate();
        }
        if (request.message === 'activate') {
            sendResponse({message: 'active'});
            activate();
        }
    });
    actionDelete.addEventListener('click', actionDeleteClick, false);
    actionDelete.addEventListener('mouseup', function(e) {
        e.stopPropagation();
    }, false);
    actionDelete.addEventListener('mousedown', function(e) {
        e.stopPropagation();
    }, false);
    linkInput.addEventListener('click', linkInputClick, false);
    linkDelete.addEventListener('click', linkDeleteClick, false);

})(window, document, chrome);