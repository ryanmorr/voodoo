export default function voodoo(source) {
    const exec = new Function(`
        with (this) {
            ${source}
        }
    `);
    return (data, traps) => {
        const handler = {};
        if (traps) {
            if (traps.get) {
                handler.get = (obj, prop) => {
                    const value = obj[prop];
                    if (prop !== Symbol.unscopables) {
                        traps.get(prop, value);
                    }
                    return value;
                };
            }
            if (traps.set) {
                handler.set = (obj, prop, nextVal) => {
                    const prevVal = obj[prop];
                    obj[prop] = nextVal;
                    traps.set(prop, nextVal, prevVal);
                    return true;
                };
            }
            if (traps.delete) {
                handler.deleteProperty = (obj, prop) => {
                    const value = obj[prop];
                    const isDeleted = delete obj[prop];
                    if (isDeleted) {
                        traps.delete(prop, value);
                    }
                    return isDeleted;
                };
            }
        }
        const proxy = new Proxy(data, handler);
        exec.call(proxy);
        return proxy;
    };
}
