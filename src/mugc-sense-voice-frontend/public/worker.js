console.log("Worker.js is loaded");

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import LoadVosk from "./vosk-wasm.js";
import { ClientMessage, } from "./interfaces.js";
import { Logger } from "./utils/logging.js";
const ctx = self;
export class RecognizerWorker {
    constructor() {
        this.recognizers = new Map();
        this.logger = new Logger();
        ctx.addEventListener("message", (event) => this.handleMessage(event));
    }
    handleMessage(event) {
        const message = event.data;
        if (!message) {
            return;
        }
        this.logger.debug(JSON.stringify(message));
        if (ClientMessage.isLoadMessage(message)) {
            const { modelUrl } = message;
            if (!modelUrl) {
                ctx.postMessage({
                    event: "error",
                    error: "Missing modelUrl parameter",
                });
            }
            this.load(modelUrl)
                .then((result) => {
                    ctx.postMessage({ event: "load", result });
                })
                .catch((error) => {
                    this.logger.error(error);
                    ctx.postMessage({ event: "error", error: error.message });
                });
            return;
        }
        if (ClientMessage.isSetMessage(message)) {
            this.setConfiguration(message);
            return;
        }
        if (ClientMessage.isAudioChunkMessage(message)) {
            this.processAudioChunk(message)
                .then((result) => {
                    ctx.postMessage(result);
                })
                .catch((error) => ctx.postMessage({ event: "error", recognizerId: message.recognizerId, error: error.message }));
            return;
        }
        if (ClientMessage.isRecognizerRemoveMessage(message)) {
            this.removeRecognizer(message.recognizerId)
                .then((result) => {
                    ctx.postMessage(result);
                })
                .catch((error) => ctx.postMessage({ event: "error", recognizerId: message.recognizerId, error: error.message }));
            return;
        }
        if (ClientMessage.isRecognizerCreateMessage(message)) {
            this.createRecognizer(message)
                .then((result) => {
                    ctx.postMessage(result);
                })
                .catch((error) => ctx.postMessage({ event: "error", recognizerId: message.recognizerId, error: error.message }));
            return;
        }
        if (ClientMessage.isRecognizerRetrieveFinalResultMessage(message)) {
            this.retrieveFinalResult(message.recognizerId)
                .then((result) => {
                    ctx.postMessage(result);
                })
                .catch((error) => ctx.postMessage({ event: "error", recognizerId: message.recognizerId, error: error.message }));
            return;
        }
        if (ClientMessage.isTerminateMessage(message)) {
            this.terminate();
            return;
        }
        ctx.postMessage({ event: "error", error: `Unknown message ${JSON.stringify(message)}` });
    }
    load(modelUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const storagePath = "/vosk";
            const modelPath = storagePath + "/" + modelUrl.replace(/[\W]/g, "_");
            return new Promise((resolve, reject) => LoadVosk()
                .then((loaded) => {
                    this.Vosk = loaded;
                    resolve(true);
                })
                .catch((e) => {
                    this.logger.error(e);
                    reject(e);
                }))
                .then(() => {
                    this.Vosk.SetLogLevel(this.logger.getLogLevel());
                    this.logger.verbose("Setting up persistent storage at " + storagePath);
                    this.Vosk.FS.mkdir(storagePath);
                    this.Vosk.FS.mount(this.Vosk.IDBFS, {}, storagePath);
                    return this.Vosk.syncFilesystem(true);
                })
                .then(() => {
                    // TODO parse Url
                    const fullModelUrl = new URL(modelUrl, location.href.replace(/^blob:/, ""));
                    this.logger.verbose(`Downloading ${fullModelUrl} to ${modelPath}`);
                    return this.Vosk.downloadAndExtract(fullModelUrl.toString(), modelPath);
                })
                .then(() => {
                    this.logger.verbose(`Syncing filesystem`);
                    return this.Vosk.syncFilesystem(false);
                })
                .then(() => {
                    this.logger.verbose(`Creating model`);
                    this.model = new this.Vosk.Model(modelPath);
                    this.logger.verbose(`Model created`);
                })
                .then(() => {
                    return true;
                });
        });
    }
    allocateBuffer(size, recognizer) {
        if (recognizer.buffAddr != null && recognizer.buffSize === size) {
            return;
        }
        this.freeBuffer(recognizer);
        recognizer.buffAddr = this.Vosk._malloc(size);
        recognizer.buffSize = size;
        this.logger.debug(`Recognizer (id: ${recognizer.id}): allocated buffer of ${recognizer.buffSize} bytes`);
    }
    freeBuffer(recognizer) {
        if (recognizer.buffAddr == null) {
            return;
        }
        this.Vosk._free(recognizer.buffAddr);
        this.logger.debug(`Recognizer (id: ${recognizer.id}): freed buffer of ${recognizer.buffSize} bytes`);
        recognizer.buffAddr = undefined;
        recognizer.buffSize = undefined;
    }
    createRecognizer(_a) {
        return __awaiter(this, arguments, void 0, function* ({ recognizerId, sampleRate, grammar, }) {
            this.logger.verbose(`Creating recognizer (id: ${recognizerId}) with sample rate ${sampleRate} and grammar ${grammar}`);
            try {
                let recognizer;
                if (grammar) {
                    recognizer = new this.Vosk.Recognizer(this.model, sampleRate, grammar);
                }
                else {
                    recognizer = new this.Vosk.Recognizer(this.model, sampleRate);
                }
                this.recognizers.set(recognizerId, {
                    id: recognizerId,
                    recognizer,
                    sampleRate,
                    grammar,
                });
            }
            catch (error) {
                const errorMsg = `Recognizer (id: ${recognizerId}): Could not be created due to: ${error}\n${error === null || error === void 0 ? void 0 : error.stack}`;
                this.logger.error(errorMsg);
                throw new Error(errorMsg);
            }
        });
    }
    setConfiguration(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const { key } = message;
            switch (key) {
                case "words":
                    const { recognizerId, value } = message;
                    this.logger.verbose(`Recognizer (id: ${recognizerId}): set ${key} to ${value}`);
                    if (!this.recognizers.has(recognizerId)) {
                        this.logger.warn(`Recognizer not ready, ignoring`);
                        return;
                    }
                    const recognizer = this.recognizers.get(recognizerId);
                    recognizer.words = value;
                    recognizer.recognizer.SetWords(value);
                    break;
                case "logLevel":
                    const level = message.value;
                    this.logger.verbose(`Set ${key} to ${level}`);
                    if (this.Vosk) {
                        this.Vosk.SetLogLevel(level);
                    }
                    this.logger.setLogLevel(level);
                    break;
                default:
                    this.logger.warn(`Unrecognized key ${key}`);
            }
        });
    }
    processAudioChunk(_a) {
        return __awaiter(this, arguments, void 0, function* ({ recognizerId, data, sampleRate, }) {
            this.logger.debug(`Recognizer (id: ${recognizerId}): process audio chunk with sampleRate ${sampleRate}`);
            if (!this.recognizers.has(recognizerId)) {
                this.logger.error(`Recognizer (id: ${recognizerId}) not ready, ignoring`);
                throw new Error(`Recognizer (id: ${recognizerId}): Not ready`);
            }
            let recognizer = this.recognizers.get(recognizerId);
            if (recognizer.sampleRate !== sampleRate) {
                this.logger.warn(`Recognizer (id: ${recognizerId}) was created with sampleRate ${recognizer.sampleRate} but audio chunk with sampleRate ${sampleRate} was received! Recreating recognizer...`);
                yield this.createRecognizer({
                    action: "create",
                    recognizerId,
                    sampleRate,
                    grammar: recognizer.grammar,
                });
                const newRecognizer = this.recognizers.get(recognizerId);
                if (recognizer.words) {
                    newRecognizer.words = true;
                    newRecognizer.recognizer.SetWords(true);
                }
                recognizer = newRecognizer;
            }
            const requiredSize = data.length * data.BYTES_PER_ELEMENT;
            this.allocateBuffer(requiredSize, recognizer);
            if (recognizer.buffAddr == null) {
                const error = `Recognizer (id: ${recognizer.id}): Could not allocate buffer`;
                this.logger.error(error);
                throw new Error(error);
            }
            this.Vosk.HEAPF32.set(data, recognizer.buffAddr / data.BYTES_PER_ELEMENT);
            let json;
            if (recognizer.recognizer.AcceptWaveform(recognizer.buffAddr, data.length)) {
                json = recognizer.recognizer.Result();
                return {
                    event: "result",
                    recognizerId: recognizer.id,
                    result: JSON.parse(json),
                };
            }
            else {
                json = recognizer.recognizer.PartialResult();
                return {
                    event: "partialresult",
                    recognizerId: recognizer.id,
                    result: JSON.parse(json),
                };
            }
        });
    }
    retrieveFinalResult(recognizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.recognizers.has(recognizerId)) {
                throw new Error(`Recognizer (id: ${recognizerId}): Does not exist or has already been deleted`);
            }
            const recognizer = this.recognizers.get(recognizerId);
            const finalResult = recognizer.recognizer.FinalResult();
            return {
                event: "result",
                recognizerId,
                result: JSON.parse(finalResult),
            };
        });
    }
    removeRecognizer(recognizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.recognizers.has(recognizerId)) {
                throw new Error(`Recognizer (id: ${recognizerId}): Does not exist or has already been deleted`);
            }
            const recognizer = this.recognizers.get(recognizerId);
            const finalResult = recognizer.recognizer.FinalResult();
            this.freeBuffer(recognizer);
            recognizer.recognizer.delete();
            this.recognizers.delete(recognizerId);
            return {
                event: "result",
                recognizerId,
                result: JSON.parse(finalResult),
            };
        });
    }
    terminate() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const recognizer of this.recognizers.values()) {
                try {
                    yield this.removeRecognizer(recognizer.id);
                }
                catch (error) {
                    this.logger.warn(`Recognizer (id: ${recognizer.id}) could not be removed. Ignoring as we are terminating.`);
                }
            }
            this.model.delete();
            close();
        });
    }
}
new RecognizerWorker();
