import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';
import { Accounts } from 'meteor/accounts-base';

import { Eits } from './eits.js';

if (Meteor.isServer) {
    describe('EITs', () => {
        describe('methods', () => {
            const username = 'didi';
            let EitId, userId;

            before(() => {
                //create user if not created
                const user = Meteor.users.findOne({ username: username });
                if (!user) {
                    userId = Accounts.createUser({
                        'username': username,
                        'email': 'a@a.com',
                        'password': '1234567',
                    });
                } else {
                    userId = user._id;
                }
            });


            beforeEach(() => {
                Eits.remove({});
                EitId = Eits.insert({
                    name: 'Lady',
                    age: '22',
                    phone: '55666',
                    country: 'Ghana',
                    area: 'Tech',
                    fact: 'something',
                    createdAt: new Date(),
                    owner: userId,
                    username: 'tmeasday',
                });
            });

            it('can delete owned task', () => {
                // Find the internal implementation of the task method so we can
                // test it in isolation
                const deleteTask = Meteor.server.method_handlers['eits.remove'];

                // Set up a fake method invocation that looks like what the method expects
                const invocation = { userId };

                // Run the method with `this` set to the fake invocation
                deleteTask.apply(invocation, [EitId]);

                // Verify that the method does what we expected
                assert.equal(Eits.find().count(), 0);
            });


            //Cannot delete someone else's task
            it("cannot delete someone else's task",() =>{
                    const userId = Random.id();
                    const deleteTask = Meteor.server.method_handlers['eits.remove'];
                    const invocation = { userId }
                    assert.throws ( () => {
                      deleteTask.apply(invocation, [EitId]);
                    }, Meteor.Error, '[not-authorized]');
                    assert.equal(Eits.find({}).count(), 1);
            })

            //Can add EIT
            it('can add Eit', () => {
                const insertTask = Meteor.server.method_handlers['eits.insert'];
                const invocation = { userId };
                insertTask.apply(invocation, [
                    {
                        name: 'Lady',
                        age: '22',
                        phone: '55666',
                        country: 'Ghana',
                        area: 'Tech',
                        fact: 'something',
                        createdAt: new Date(),
                        owner: userId,
                        username: 'tmeasday',
                    }
                ]);
                assert.equal(Eits.find().count(), 2);
            });
        

            //Cannot add EIT if not logged in
            it('cannot add EIT if not logged in', () => {
                const InsertTask = Meteor.server.method_handlers['eits.insert'];
                const invocation = {};
                assert.throws(() => {
                  InsertTask.apply(invocation, [
                    {
                        name: 'Lady',
                        age: '22',
                        phone: '55666',
                        country: 'Ghana',
                        area: 'Tech',
                        fact: 'something',
                        createdAt: new Date(),
                        owner: userId,
                        username: 'tmeasday',
                    }
                  ]);
                }, Meteor.Error, '[not-authorized]');
                assert.equal(Eits.find().count(), 1);
              });

            //Can edit EIT
            it ('can edit EIT', () =>{
                const editTask = Meteor.server.method_handlers['eits.edit'];
                const invocation = { userId };
                editTask.apply(invocation, [EitId,
                    {
                        name: 'Larry',
                        age: '22',
                        phone: '55666',
                        country: 'Ghana',
                        area: 'Tech',
                        fact: 'something',
                        createdAt: new Date(),
                        owner: userId,
                        username: 'tmeasday',
                    }
                ]);
                assert.equal(Eits.find({name:'Larry'}).count(),1)
            })


            //cannot eit eit
            it ('cannot edit EIt', () => {
                const editTask= Meteor.server.method_handlers['eits.edit'];
                const invocation = { };
                assert.throws ( () => {
                editTask.apply(invocation, [EitId,
                    {
                        name: 'Larry',
                        age: '22',
                        phone: '55666',
                        country: 'Ghana',
                        area: 'Tech',
                        fact: 'something',
                        createdAt: new Date(),
                        owner: userId,
                        username: 'tmeasday',
                    }
                ]);
            },Meteor.Error, '[not-authorized]');
            assert.equal(Eits.find({}).count(), 1);
            })

            //can view Eits
            it('can view own task and non-private tasks', () => {
                const userId = Random.id()
                Eits.insert({
                  text: 'test task 2',
                  created: new Date(),
                  owner: userId,
                  username: 'Larry'
                })
                const invocation = { userId }
                const TasksPublication = Meteor.server.publish_handlers.eits
         
                assert.strictEqual(TasksPublication.apply(invocation).count(), 2)
              })


        });
    });
}
