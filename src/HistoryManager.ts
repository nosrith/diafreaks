interface HistoryElement {
    undo: () => void;
    redo: () => void;
}

export default class HistoryManager {
    constructor(public capacity: number) {}
    private undos: HistoryElement[] = [];
    private redos: HistoryElement[] = [];

    get undoable(): boolean { return this.undos.length > 0; }
    get redoable(): boolean { return this.redos.length > 0; }

    push(elem: HistoryElement): void {
        if (this.undos.length >= this.capacity) {
            this.undos.splice(0, this.undos.length - this.capacity + 1);
        }
        this.undos.push(elem);
        this.redos.splice(0);
    }

    clear(): void {
        this.undos.splice(0);
        this.redos.splice(0);
    }

    undo(): void {
        const elem = this.undos.pop();
        if (elem) {
            this.redos.push(elem);
            elem.undo();
        }
    }

    redo(): void {
        const elem = this.redos.pop();
        if (elem) {
            this.undos.push(elem);
            elem.redo();
        }
    }
}
