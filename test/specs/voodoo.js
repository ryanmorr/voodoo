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
        const spy = sinon.spy();

        const exec = voodoo(`
            foo(bar);
        `);
        
        exec({foo: spy, bar: 'baz'});

        expect(spy.callCount).to.equal(1);
        expect(spy.args[0].length).to.equal(1);
        expect(spy.args[0][0]).to.equal('baz');
    });

    it('should notify observers when accessing the value of a variable', () => {
        const spy = sinon.spy();

        const exec = voodoo(`
            const a = foo;
            const b = baz;
            const c = foo;
        `, {
            get(...args) {
                spy(...args);
            }
        });
        
        exec({foo: 'bar', baz: 'qux'});

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
        `, {
            set(...args) {
                spy(...args);
            }
        });
        
        exec({foo: 1, bar: 10});

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
        `, {
            delete(...args) {
                spy(...args);
            }
        });
        
        exec({foo: 1, bar: 2});

        expect(spy.callCount).to.equal(2);

        expect(spy.args[0].length).to.equal(2);
        expect(spy.args[0][0]).to.equal('foo');
        expect(spy.args[0][1]).to.equal(1);

        expect(spy.args[1].length).to.equal(2);
        expect(spy.args[1][0]).to.equal('bar');
        expect(spy.args[1][1]).to.equal(2);
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

    it('should support multiple calls', () => {
        const getSpy = sinon.spy();
        const setSpy = sinon.spy();
        const deleteSpy = sinon.spy();

        const exec = voodoo(`
            const a = foo;
            foo = bar;
            delete foo;
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
        
        exec({foo: 1, bar: 2});

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

        exec({foo: 'a', bar: 'b'});

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
        
        const data = exec({foo: 'bar'});

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

            expect(data).to.deep.equal({});

            done();
        }, 200);
    });

    it('should keep the returned data object up-to-date with the current variables values', (done) => {
        const exec = voodoo(`
            setTimeout(() => {
                foo = 3;
                bar = 5;
                delete baz;
            }, 100);
        `);
        
        const data = exec({foo: 1, bar: 2, baz: 3});

        expect(data).to.deep.equal({foo: 1, bar: 2, baz: 3});

        setTimeout(() => {
            expect(data).to.deep.equal({foo: 3, bar: 5});
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
        `, {
            set(...args) {
                expect(data.foo).to.equal(2);
                spy(...args);
            }
        });
        
        data = exec({foo: 1});

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
        `, {
            delete(...args) {
                expect(data).to.not.have.property('foo');
                spy(...args);
            }
        });
        
        data = exec({foo: 1});

        setTimeout(() => {
            expect(spy.callCount).to.equal(1);
            done();
        }, 200);
    });

    it('should not call the delete observers if the variable could not be deleted', () => {
        const spy = sinon.spy();
        const exec = voodoo(`
            try {
                delete foo;
            } catch (e) {
                global._val = e;
            }

        `, {
            delete(...args) {
                spy(...args);
            }
        });

        const obj = {};
        Object.defineProperty(obj, 'foo', {
            value: 1,
            configurable: false
        })
        
        exec(obj);
        
        expect(spy.callCount).to.equal(0);
        expect(global._val).to.be.an.instanceof(TypeError);
        expect(global._val.message).to.equal('Cannot delete property \'foo\' of #<Object>');
    });
});
