export var ClientMessage;
(function (ClientMessage) {
    function isTerminateMessage(message) {
        return (message === null || message === void 0 ? void 0 : message.action) === "terminate";
    }
    ClientMessage.isTerminateMessage = isTerminateMessage;
    function isLoadMessage(message) {
        return (message === null || message === void 0 ? void 0 : message.action) === "load";
    }
    ClientMessage.isLoadMessage = isLoadMessage;
    function isSetMessage(message) {
        return (message === null || message === void 0 ? void 0 : message.action) === "set";
    }
    ClientMessage.isSetMessage = isSetMessage;
    function isAudioChunkMessage(message) {
        return (message === null || message === void 0 ? void 0 : message.action) === "audioChunk";
    }
    ClientMessage.isAudioChunkMessage = isAudioChunkMessage;
    function isRecognizerCreateMessage(message) {
        return (message === null || message === void 0 ? void 0 : message.action) === "create";
    }
    ClientMessage.isRecognizerCreateMessage = isRecognizerCreateMessage;
    function isRecognizerRetrieveFinalResultMessage(message) {
        return (message === null || message === void 0 ? void 0 : message.action) === "retrieveFinalResult";
    }
    ClientMessage.isRecognizerRetrieveFinalResultMessage = isRecognizerRetrieveFinalResultMessage;
    function isRecognizerRemoveMessage(message) {
        return (message === null || message === void 0 ? void 0 : message.action) === "remove";
    }
    ClientMessage.isRecognizerRemoveMessage = isRecognizerRemoveMessage;
})(ClientMessage || (ClientMessage = {}));
export var ModelMessage;
(function (ModelMessage) {
    function isLoadResult(message) {
        return (message === null || message === void 0 ? void 0 : message.event) === "load";
    }
    ModelMessage.isLoadResult = isLoadResult;
})(ModelMessage || (ModelMessage = {}));
export var ServerMessage;
(function (ServerMessage) {
    function isRecognizerMessage(message) {
        return ["result", "partialresult"].includes(message.event) || Reflect.has(message, 'recognizerId');
    }
    ServerMessage.isRecognizerMessage = isRecognizerMessage;
    function isResult(message) {
        var _a, _b;
        return ((_a = message === null || message === void 0 ? void 0 : message.result) === null || _a === void 0 ? void 0 : _a.text) != null || ((_b = message === null || message === void 0 ? void 0 : message.result) === null || _b === void 0 ? void 0 : _b.result) != null;
    }
    ServerMessage.isResult = isResult;
    function isPartialResult(message) {
        var _a;
        return ((_a = message === null || message === void 0 ? void 0 : message.result) === null || _a === void 0 ? void 0 : _a.partial) != null;
    }
    ServerMessage.isPartialResult = isPartialResult;
})(ServerMessage || (ServerMessage = {}));
