export default function voodoo(source) {
    const fn = new Function('__object__', `
        with (__object__) {
            ${source}
        }
    `);
    return (object) => {
        fn.call(object, object);
        return object;
    }
}
