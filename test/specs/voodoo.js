import { expect } from 'chai';
import sinon from 'sinon';
import voodoo from '../../src/voodoo';

describe('voodoo', () => {
    it('should return a function', () => {
        const exec = voodoo('');

        expect(exec).to.a('function');
    });

    it('should get a property value', () => {
        const exec = voodoo(`
            global._val = foo;
        `);

        exec({foo: 1});
        expect(global._val).to.equal(1);
    });

    it('should set a property value', () => {
        const exec = voodoo(`
            foo = 2;
            global._val = foo;
        `);

        exec({foo: 1});
        expect(global._val).to.equal(2);
    });
});
