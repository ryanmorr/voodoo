import { expect } from 'chai';
import sinon from 'sinon';
import voodoo from '../../src/voodoo.js';

describe('voodoo', () => {
    afterEach(() => {
        if (global._val) {
            delete global._val;
        }
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
        
        expect(data).to.deep.equal({foo: 1, bar: 2});
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
                global._val = foo;
            } else {
                global._val = 'failed';
            }
        `);

        const data = exec({foo: 1});
        expect(data).to.have.property('foo');
        expect(data.foo).to.equal(undefined);
        expect(global._val).to.equal(undefined);
    });

    it('should notify observers when accessing the value of a variable', () => {
        const spy = sinon.spy();

        const exec = voodoo(`
            const a = foo;
            const b = baz;
            const c = foo;
        `);
        
        exec({foo: 'bar', baz: 'qux'}, {
            get: spy
        });

        expect(spy.callCount).to.equal(3);

        expect(spy.args[0].length).to.equal(2);
        expect(spy.args[0][0]).to.equal('foo');
        expect(spy.args[0][1]).to.equal('bar');

        expect(spy.args[1].length).to.equal(2);
        expect(spy.args[1][0]).to.equal('baz');
        expect(spy.args[1][1]).to.equal('qux');

        expect(spy.args[2].length).to.equal(2);
        expect(spy.args[2][0]).to.equal('foo');
        expect(spy.args[2][1]).to.equal('bar');
    });

    it('should notify observers when setting the value of a variable', () => {
        const spy = sinon.spy();

        const exec = voodoo(`
            foo = 2;
            bar = 20;
        `);
        
        exec({foo: 1, bar: 10}, {
            set: spy
        });

        expect(spy.callCount).to.equal(2);

        expect(spy.args[0].length).to.equal(3);
        expect(spy.args[0][0]).to.equal('foo');
        expect(spy.args[0][1]).to.equal(2);
        expect(spy.args[0][2]).to.equal(1);

        expect(spy.args[1].length).to.equal(3);
        expect(spy.args[1][0]).to.equal('bar');
        expect(spy.args[1][1]).to.equal(20);
        expect(spy.args[1][2]).to.equal(10);
    });

    it('should notify observers when deleting a variable', () => {
        const spy = sinon.spy();

        const exec = voodoo(`
            delete foo;
            delete bar;
        `);
        
        exec({foo: 1, bar: 2}, {
            delete: spy
        });

        expect(spy.callCount).to.equal(2);

        expect(spy.args[0].length).to.equal(2);
        expect(spy.args[0][0]).to.equal('foo');
        expect(spy.args[0][1]).to.equal(1);

        expect(spy.args[1].length).to.equal(2);
        expect(spy.args[1][0]).to.equal('bar');
        expect(spy.args[1][1]).to.equal(2);
    });

    it('should notify observers in order when accessing, reassigning, and deleting a variable', () => {
        const getSpy = sinon.spy();
        const setSpy = sinon.spy();
        const deleteSpy = sinon.spy();

        const exec = voodoo(`
            const a = foo;
            foo = 'baz';
            foo = 'qux'
            delete foo;
            foo = 1;
        `);
        
        exec({foo: 'bar'}, {
            get: getSpy,
            set: setSpy,
            delete: deleteSpy
        });

        expect(getSpy.callCount).to.equal(1);
        expect(setSpy.callCount).to.equal(3);
        expect(deleteSpy.callCount).to.equal(1);

        const getCall1 = getSpy.getCall(0);
        const setCall1 = setSpy.getCall(0);
        const setCall2 = setSpy.getCall(1);
        const setCall3 = setSpy.getCall(2);
        const deleteCall = deleteSpy.getCall(0);

        expect(getCall1.calledBefore(setCall1)).to.equal(true);
        expect(setCall1.calledBefore(setCall2)).to.equal(true);
        expect(setCall2.calledBefore(deleteCall)).to.equal(true);
        expect(deleteCall.calledBefore(setCall3)).to.equal(true);
    });

    it('should support multiple calls', () => {
        const getSpy = sinon.spy();
        const setSpy = sinon.spy();
        const deleteSpy = sinon.spy();

        const exec = voodoo(`
            const a = foo;
            foo = bar;
            delete foo;
        `);
        
        exec({foo: 1, bar: 2}, {
            get: getSpy,
            set: setSpy,
            delete: deleteSpy
        });

        expect(getSpy.callCount).to.equal(2);
        expect(getSpy.args[0][0]).to.equal('foo');
        expect(getSpy.args[0][1]).to.equal(1);

        expect(getSpy.args[1][0]).to.equal('bar');
        expect(getSpy.args[1][1]).to.equal(2);

        expect(setSpy.callCount).to.equal(1);
        expect(setSpy.args[0][0]).to.equal('foo');
        expect(setSpy.args[0][1]).to.equal(2);
        expect(setSpy.args[0][2]).to.equal(1);

        expect(deleteSpy.callCount).to.equal(1);
        expect(deleteSpy.args[0][0]).to.equal('foo');
        expect(deleteSpy.args[0][1]).to.equal(2);

        exec({foo: 'a', bar: 'b'}, {
            get: getSpy,
            set: setSpy,
            delete: deleteSpy
        });

        expect(getSpy.callCount).to.equal(4);
        expect(getSpy.args[2][0]).to.equal('foo');
        expect(getSpy.args[2][1]).to.equal('a');

        expect(getSpy.args[3][0]).to.equal('bar');
        expect(getSpy.args[3][1]).to.equal('b');

        expect(setSpy.callCount).to.equal(2);
        expect(setSpy.args[1][0]).to.equal('foo');
        expect(setSpy.args[1][1]).to.equal('b');
        expect(setSpy.args[1][2]).to.equal('a');

        expect(deleteSpy.callCount).to.equal(2);
        expect(deleteSpy.args[1][0]).to.equal('foo');
        expect(deleteSpy.args[1][1]).to.equal('b');
    });

    it('should support async usage', (done) => {
        const getSpy = sinon.spy();
        const setSpy = sinon.spy();
        const deleteSpy = sinon.spy();

        const exec = voodoo(`
            setTimeout(() => {
                const a = foo;
                foo = 'baz';
                delete foo;
            }, 100);
        `);
        
        const data = exec({foo: 'bar'}, {
            get: getSpy,
            set: setSpy,
            delete: deleteSpy
        });

        setTimeout(() => {
            expect(getSpy.callCount).to.equal(1);
            expect(getSpy.args[0][0]).to.equal('foo');
            expect(getSpy.args[0][1]).to.equal('bar');

            expect(setSpy.callCount).to.equal(1);
            expect(setSpy.args[0][0]).to.equal('foo');
            expect(setSpy.args[0][1]).to.equal('baz');
            expect(setSpy.args[0][2]).to.equal('bar');

            expect(deleteSpy.callCount).to.equal(1);
            expect(deleteSpy.args[0][0]).to.equal('foo');
            expect(deleteSpy.args[0][1]).to.equal('baz');

            expect(data).to.deep.equal({foo: undefined});

            done();
        }, 200);
    });

    it('should keep the property values of the returned data object in sync with the value of the variables', (done) => {
        const exec = voodoo(`
            setTimeout(() => {
                foo = 3;
                bar = 5;
                delete baz;
                global._val = qux;
            }, 100);
        `);
        
        const data = exec({foo: 1, bar: 2, baz: 3});

        expect(data).to.deep.equal({foo: 1, bar: 2, baz: 3});

        data.qux = 10;

        setTimeout(() => {
            expect(data).to.deep.equal({foo: 3, bar: 5, baz: undefined, qux: 10});
            expect(global._val).to.deep.equal(10);

            done();
        }, 200);
    });

    it('should set the variable before calling observers', (done) => {
        let data;
        const spy = sinon.spy();

        const exec = voodoo(`
            setTimeout(() => {
                foo = 2;
            }, 100);
        `);
        
        data = exec({foo: 1}, {
            set(...args) {
                expect(data.foo).to.equal(2);
                spy(...args);
            }
        });

        setTimeout(() => {
            expect(spy.callCount).to.equal(1);
            done();
        }, 200);
    });

    it('should delete the variable before calling observers', (done) => {
        let data;
        const spy = sinon.spy();

        const exec = voodoo(`
            setTimeout(() => {
                delete foo;
            }, 100);
        `);
        
        data = exec({foo: 1}, {
            delete(...args) {
                expect(data.foo).to.equal(undefined);
                spy(...args);
            }
        });

        setTimeout(() => {
            expect(spy.callCount).to.equal(1);
            done();
        }, 200);
    });

    it('should respect unscopables', () => {
        const spy = sinon.spy();

        const exec = voodoo(`
            try {
                const a = foo;
                const b = bar;
            } catch (e) {
                global._val = e;
            }
        `);

        const obj = {foo: 1, bar: 2};
        obj[Symbol.unscopables] = {
            foo: false,
            bar: true
        };
        
        exec(obj, {
            get: spy
        });

        expect(spy.callCount).to.equal(1);
        expect(spy.args[0][0]).to.equal('foo');
        expect(spy.args[0][1]).to.equal(1);
        expect(global._val).to.be.an.instanceof(ReferenceError);
        expect(global._val.message).to.equal('bar is not defined');
    });

    it('should support a function as the source', (done) => {
        const getSpy = sinon.spy();
        const setSpy = sinon.spy();
    
        const exec = voodoo((foo, bar) => {
            setTimeout(() => {
                bar = foo + bar;
            }, 100);
        });
        
        exec({foo: 1, bar: 2}, {
            get: getSpy,
            set: setSpy
        });
    
        setTimeout(() => {
            expect(getSpy.callCount).to.equal(2);
            expect(getSpy.args[0][0]).to.equal('foo');
            expect(getSpy.args[0][1]).to.equal(1);
            expect(getSpy.args[1][0]).to.equal('bar');
            expect(getSpy.args[1][1]).to.equal(2);
    
            expect(setSpy.callCount).to.equal(1);
            expect(setSpy.args[0][0]).to.equal('bar');
            expect(setSpy.args[0][1]).to.equal(3);
            expect(setSpy.args[0][2]).to.equal(2);
    
            done();
        }, 200);
    });
});
