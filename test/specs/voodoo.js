import { expect } from 'chai';
import sinon from 'sinon';
import voodoo from '../../src/voodoo';

describe('voodoo', () => {
    afterEach(() => {
        delete global._val;
    });

    it('should return a function', () => {
        const exec = voodoo('');

        expect(exec).to.a('function');
    });

    it('should execute the function in the context of the passed object', () => {
        const exec = voodoo(`
            global._val = this;
        `);

        const data = {};
        exec(data);
        expect(global._val).to.equal(data);
    });

    it('should return a data object from the function', () => {
        const exec = voodoo('');

        const data = exec({foo: 1, bar: 2});
        expect(data).to.deep.equal({foo: 1, bar: 2})
    });

    it('should get the value of a variable', () => {
        const exec = voodoo(`
            global._val = foo;
        `);

        exec({foo: 1});
        expect(global._val).to.equal(1);
    });

    it('should set the value of a variable', () => {
        const exec = voodoo(`
            foo = 2;
            global._val = foo;
        `);

        const data = exec({foo: 1});
        expect(data.foo).to.equal(2);
        expect(global._val).to.equal(2);
    });

    it('should delete a variable', () => {
        const exec = voodoo(`
            if (delete foo) {
                try {
                    global._val = foo;
                } catch (e) {
                    global._val = e;
                } 
            }
        `);

        const data = exec({foo: 1});
        expect(data).to.not.have.property('foo');
        expect(global._val).to.be.an.instanceof(ReferenceError);
        expect(global._val.message).to.equal('foo is not defined');
    });
});
