export default function voodoo(source) {
    const fn = new Function('__object__', `(function(){
        with (__object__) {
            ${source}
        }
    })()`);
    return (object) => fn(object);
}
