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

        exec({foo: 1});
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

        exec({foo: 1});
        expect(global._val).to.be.an.instanceof(ReferenceError);
        expect(global._val.message).to.equal('foo is not defined');
    });
});
