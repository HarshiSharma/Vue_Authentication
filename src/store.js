import Vue from 'vue'
import Vuex from 'vuex'
import axios from './axios.auth'
import globalAxios from 'axios'
import router from './router'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        idToken: null,
        userId: null,
        user: null
    },
    mutations: {
        authUser(state, userData) {
            state.idToken = userData.token;
            state.userId = userData.userId;
        },
        storeUser(state, user) {
            state.user = user
        },
        clearAuthData(state) {
            state.idToken = null
            state.userId = null

        }
    },
    actions: {
        setLogoutTimer({ commit }, expirationTime) {
            setTimeout(() => {
                commit('clearAuthData')
            }, expirationTime * 1000)
        },
        signup({ commit, dispatch }, authData) {
            axios
                .post("/accounts:signUp?key=AIzaSyB6S8AAo3OXSMhozVoCrZnJIx8HfB2y_oo", {
                    email: authData.email,
                    password: authData.password,
                    returnSecureToken: true
                })
                .then(res => {
                    console.log(res)
                    commit('authUser', {
                        token: res.data.idToken,
                        userId: res.data.localId
                    })
                    const now = new Date()
                    const expirationDate = new Date(now.getTime() + res.data.expiresIn * 1000)
                    localStorage.setItem('token', res.data.idToken)
                    localStorage.setItem('userId', res.data.localId)
                    localStorage.setItem('expirationDate', expirationDate)
                    dispatch('storeUser', authData)
                    dispatch('setLogoutTimer', res.data.expiresIn)
                })
                .catch(error => console.log(error));
        },
        tryAutoLogin({ commit, dispatch }) {
            const token = localStorage.getItem('token')
            if (!token) {
                return
            }
            const expirationDate = localStorage.getItem('expirationDate')
            const now = new Date()
            if (now >= expirationDate) {
                return
            }
            const userId = localStorage.getItem('userId')
            commit('authUser', {
                token: token,
                userId: userId
            })
            router.replace('/dashboard')

        },
        login({ commit, dispatch }, authData) {
            axios
                .post(
                    "accounts:signInWithPassword?key=AIzaSyB6S8AAo3OXSMhozVoCrZnJIx8HfB2y_oo", {
                        email: authData.email,
                        password: authData.password,
                        returnSecureToken: true
                    }
                )
                .then(res => {
                    console.log(res)
                    commit('authUser', {
                        token: res.data.idToken,
                        userId: res.data.localId
                    })
                    const now = new Date()
                    const expirationDate = new Date(now.getTime() + res.data.expiresIn * 1000)
                    localStorage.setItem('token', res.data.idToken)
                    localStorage.setItem('userId', res.data.localId)
                    localStorage.setItem('expirationDate', expirationDate)
                    dispatch('setLogoutTimer', res.data.expiresIn)
                    router.replace('/dashboard')
                })
                .catch(error => console.log(error));
        },
        storeUser({ commit, state }, userData) {
            if (!this.state.idToken) {
                return
            }
            globalAxios.post('/users.json' + '?auth=' + state.idToken, userData)
                .then(res => {
                    console.log(res);
                    console.log('What')
                })
                .catch(error => console.log(error))
        },
        fetchUser({ commit, state }) {
            if (!this.state.idToken) {
                return
            }
            globalAxios.get('/users.json' + '?auth=' + state.idToken)
                .then(res => {
                    console.log("created: response", res);
                    const data = res.data;
                    const users = [];
                    for (const key in data) {
                        if (data.hasOwnProperty(key)) {
                            const user = data[key];
                            user.id = key;
                            users.push(user);
                        }
                    }
                    console.log("created: users", users);
                    commit('storeUser', users[0])
                })
                .catch(err => console.log("created error", err));
        },
        logout({ commit }) {
            commit('clearAuthData')
            localStorage.removeItem('expirationDate')
            localStorage.removeItem('token')
            localStorage.removeItem('userId')
            router.replace('/signin')
        }
    },
    getters: {
        user(state) {
            return state.user
        },
        isAuthenticated(state) {
            return state.idToken !== null
        }
    }
})