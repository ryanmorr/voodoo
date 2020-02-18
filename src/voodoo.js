export default function voodoo(source, traps) {
    const fn = new Function('__data__', `
        with (__data__) {
            ${source}
        }
    `);
    const handler = {};
    if (traps) {
        if (traps.get) {
            handler.get = (obj, prop) => {
                const value = obj[prop];
                if (prop !== Symbol.unscopables) {
                    traps.get(prop, value);
                }
                return value;
            }
        }
        if (traps.set) {
            handler.set = (obj, prop, val) => {
                obj[prop] = val;
                traps.set(prop, val);
                return val;
            }
        }
        if (traps.delete) {
            handler.deleteProperty = (obj, prop) => {
                const value = obj[prop];
                const isDeleted = delete obj[prop];
                if (isDeleted) {
                    traps.delete(prop, value);
                }
                return isDeleted;
            }
        }
    }
    return (data) => {
        const proxy = new Proxy(data, handler);
        fn.call(proxy, proxy);
        return proxy;
    }
}
