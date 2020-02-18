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

        const data = exec({});
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

    it('should call a variable function', () => {
        const exec = voodoo(`
            foo(bar);
        `);
        
        const spy = sinon.spy();
        exec({foo: spy, bar: 'baz'});
        expect(spy.callCount).to.equal(1);
        expect(spy.args[0].length).to.equal(1);
        expect(spy.args[0][0]).to.equal('baz');
    });

    it('should notify observers when accessing the value of a variable', () => {
        const spy = sinon.spy();
        const exec = voodoo(`
            const a = foo;
            const b = foo;
            const c = foo;
        `, {
            get(...args) {
                spy(...args);
            }
        });
        
        exec({foo: 'bar'});
        expect(spy.callCount).to.equal(3);

        expect(spy.args[0].length).to.equal(2);
        expect(spy.args[0][0]).to.equal('foo');
        expect(spy.args[0][1]).to.equal('bar');

        expect(spy.args[1].length).to.equal(2);
        expect(spy.args[1][0]).to.equal('foo');
        expect(spy.args[1][1]).to.equal('bar');

        expect(spy.args[2].length).to.equal(2);
        expect(spy.args[2][0]).to.equal('foo');
        expect(spy.args[2][1]).to.equal('bar');
    });

    it('should notify observers when setting the value of a variable', () => {
        const spy = sinon.spy();
        const exec = voodoo(`
            foo = 2;
            foo = 3;
        `, {
            set(...args) {
                spy(...args);
            }
        });
        
        exec({foo: 1});
        expect(spy.callCount).to.equal(2);
        expect(spy.args[0].length).to.equal(2);
        expect(spy.args[0][0]).to.equal('foo');
        expect(spy.args[0][1]).to.equal(2);

        expect(spy.args[1].length).to.equal(2);
        expect(spy.args[1][0]).to.equal('foo');
        expect(spy.args[1][1]).to.equal(3);
    });

    it('should notify observers when deleting a variable', () => {
        const spy = sinon.spy();
        const exec = voodoo(`
            delete foo;
        `, {
            delete(...args) {
                spy(...args);
            }
        });
        
        exec({foo: 1});
        expect(spy.callCount).to.equal(1);
        expect(spy.args[0].length).to.equal(1);
        expect(spy.args[0][0]).to.equal('foo');
    });

    it('should notify observers in order when accessing, setting, and deleting a variable', () => {
        const getSpy = sinon.spy();
        const setSpy = sinon.spy();
        const deleteSpy = sinon.spy();

        const exec = voodoo(`
            const a = foo;
            foo = 'baz';
            foo = 'qux'
            delete foo;
            foo = 1;
        `, {
            get(...args) {
                getSpy(...args);
            },
            set(...args) {
                setSpy(...args);
            },
            delete(...args) {
                deleteSpy(...args);
            }
        });
        
        exec({foo: 'bar'});
        expect(getSpy.callCount).to.equal(1);
        expect(setSpy.callCount).to.equal(2);
        expect(deleteSpy.callCount).to.equal(1);

        const getCall = getSpy.getCall(0);
        const setCall1 = setSpy.getCall(0);
        const setCall2 = setSpy.getCall(1);
        const deleteCall = deleteSpy.getCall(0);

        expect(getCall.calledBefore(setCall1)).to.equal(true);
        expect(setCall1.calledBefore(setCall2)).to.equal(true);
        expect(setCall2.calledBefore(deleteCall)).to.equal(true);
    });
});
