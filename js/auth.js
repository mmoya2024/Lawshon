/*
============================================================
LASHAWN ACADEMY
AUTHENTICATION
============================================================
Requires:

1. Supabase JS CDN
2. supabase.js
3. window.LashawnDB

Roles currently used:

SUPER_ADMIN
ADMIN
BRANCH_MANAGER
RECEPTIONIST
INSTRUCTOR
FINANCE
PRINTING_OPERATOR
COMPUTER_TRAINER
AUDITOR
============================================================
*/

(function () {

    "use strict";


    /*
    ============================================================
    ELEMENTS
    ============================================================
    */

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("loginButton");
    const messageBox = document.getElementById("message");
    const togglePassword = document.getElementById("togglePassword");


    /*
    ============================================================
    DASHBOARD
    ============================================================
    */

    const DASHBOARD_URL = "dashboard.html";


    /*
    ============================================================
    ROLE LABELS
    ============================================================
    */

    const ROLE_LABELS = {
        SUPER_ADMIN: "Super Administrator",
        ADMIN: "Office Administrator",
        BRANCH_MANAGER: "Supervisor",
        RECEPTIONIST: "Receptionist",
        INSTRUCTOR: "Instructor",
        FINANCE: "Finance",
        PRINTING_OPERATOR: "Printing Operator",
        COMPUTER_TRAINER: "Computer Trainer",
        AUDITOR: "Auditor"
    };


    /*
    ============================================================
    CHECK SUPABASE
    ============================================================
    */

    if (!window.LashawnDB) {

        console.error(
            "LashawnDB was not found. Check supabase.js."
        );

        showMessage(
            "The system could not connect to the database. Please check the Supabase configuration.",
            "error"
        );

        return;
    }


    const db = window.LashawnDB;


    /*
    ============================================================
    MESSAGE
    ============================================================
    */

    function showMessage(message, type = "error") {

        if (!messageBox) return;

        messageBox.textContent = message;

        messageBox.className = "message " + type;

    }


    function clearMessage() {

        if (!messageBox) return;

        messageBox.textContent = "";

        messageBox.className = "message";

    }


    /*
    ============================================================
    BUTTON STATE
    ============================================================
    */

    function setLoading(loading) {

        if (!loginButton) return;

        loginButton.disabled = loading;

        if (loading) {

            loginButton.innerHTML =
                '<span class="loading-spinner"></span>Signing in...';

        } else {

            loginButton.textContent = "Sign In";

        }

    }


    /*
    ============================================================
    PASSWORD VISIBILITY
    ============================================================
    */

    if (togglePassword) {

        togglePassword.addEventListener(
            "click",
            function () {

                const isPassword =
                    passwordInput.type === "password";

                passwordInput.type =
                    isPassword ? "text" : "password";

                togglePassword.textContent =
                    isPassword ? "Hide" : "Show";

            }
        );

    }


    /*
    ============================================================
    GET STAFF PROFILE
    ============================================================
    */

    async function getStaffProfile(userId) {

        const { data, error } = await db
            .from("staff")
            .select(`
                id,
                auth_user_id,
                staff_number,
                first_name,
                last_name,
                email,
                role,
                branch_id,
                is_active
            `)
            .eq("auth_user_id", userId)
            .maybeSingle();

        if (error) {

            console.error(
                "Staff profile error:",
                error
            );

            throw new Error(
                "Unable to retrieve your staff profile."
            );

        }

        if (!data) {

            throw new Error(
                "Your account is authenticated, but no Lashawn staff profile was found."
            );

        }

        return data;

    }


    /*
    ============================================================
    VERIFY STAFF ACCOUNT
    ============================================================
    */

    async function verifyStaff(userId) {

        const staff = await getStaffProfile(userId);

        if (!staff.is_active) {

            await db.auth.signOut();

            throw new Error(
                "Your Lashawn Academy staff account is inactive. Please contact an administrator."
            );

        }

        return staff;

    }


    /*
    ============================================================
    SAVE SESSION PROFILE
    ============================================================
    */

    function saveStaffProfile(staff) {

        try {

            sessionStorage.setItem(
                "lashawn_staff",
                JSON.stringify(staff)
            );

        } catch (error) {

            console.warn(
                "Could not save staff profile:",
                error
            );

        }

    }


    /*
    ============================================================
    LOGIN
    ============================================================
    */

    async function login(email, password) {

        clearMessage();

        setLoading(true);

        try {

            /*
            --------------------------------------------
            Supabase Authentication
            --------------------------------------------
            */

            const {
                data: authData,
                error: authError
            } = await db.auth.signInWithPassword({
                email: email,
                password: password
            });


            if (authError) {

                console.error(
                    "Authentication error:",
                    authError
                );

                throw new Error(
                    "Invalid email or password."
                );

            }


            if (!authData || !authData.user) {

                throw new Error(
                    "Login failed. No authenticated user was returned."
                );

            }


            /*
            --------------------------------------------
            Verify staff profile
            --------------------------------------------
            */

            const staff = await verifyStaff(
                authData.user.id
            );


            /*
            --------------------------------------------
            Save profile
            --------------------------------------------
            */

            saveStaffProfile(staff);


            /*
            --------------------------------------------
            Successful login
            --------------------------------------------
            */

            const roleName =
                ROLE_LABELS[staff.role] || staff.role;


            showMessage(
                `Welcome ${staff.first_name}. Signing you in as ${roleName}...`,
                "success"
            );


            /*
            Give the browser a moment to save
            the Supabase session.
            */

            setTimeout(function () {

                window.location.href =
                    DASHBOARD_URL;

            }, 700);


        } catch (error) {

            console.error(
                "Login failed:",
                error
            );

            showMessage(
                error.message ||
                "Unable to sign in. Please try again.",
                "error"
            );

            setLoading(false);

        }

    }


    /*
    ============================================================
    LOGIN FORM
    ============================================================
    */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const email =
                    emailInput.value.trim().toLowerCase();

                const password =
                    passwordInput.value;


                if (!email) {

                    showMessage(
                        "Please enter your email address.",
                        "error"
                    );

                    emailInput.focus();

                    return;
                }


                if (!password) {

                    showMessage(
                        "Please enter your password.",
                        "error"
                    );

                    passwordInput.focus();

                    return;
                }


                await login(
                    email,
                    password
                );

            }
        );

    }


    /*
    ============================================================
    CHECK EXISTING SESSION
    ============================================================
    */

    async function checkExistingSession() {

        try {

            const {
                data,
                error
            } = await db.auth.getSession();


            if (error) {

                console.error(
                    "Session check error:",
                    error
                );

                return;

            }


            if (!data || !data.session) {

                return;

            }


            /*
            User already has an authenticated
            Supabase session.
            */

            const user =
                data.session.user;


            const staff =
                await verifyStaff(user.id);


            saveStaffProfile(staff);


            /*
            Already logged in.
            Go directly to dashboard.
            */

            window.location.href =
                DASHBOARD_URL;

        } catch (error) {

            console.warn(
                "Existing session check failed:",
                error.message
            );

            /*
            If the account is no longer valid,
            make sure the session is removed.
            */

            try {

                await db.auth.signOut();

            } catch (signOutError) {

                console.error(
                    signOutError
                );

            }

        }

    }


    /*
    ============================================================
    AUTH STATE LISTENER
    ============================================================
    */

    db.auth.onAuthStateChange(
        function (event, session) {

            console.log(
                "Auth event:",
                event
            );

            /*
            We don't redirect directly here because
            the login() function handles verification
            of the staff record first.
            */

        }
    );


    /*
    ============================================================
    LOGOUT FUNCTION
    ============================================================
    */

    window.LashawnLogout = async function () {

        try {

            await db.auth.signOut();

            sessionStorage.removeItem(
                "lashawn_staff"
            );

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            /*
            Even if Supabase reports an error,
            clear the local session.
            */

            sessionStorage.removeItem(
                "lashawn_staff"
            );

            window.location.href =
                "login.html";

        }

    };


    /*
    ============================================================
    GET CURRENT STAFF
    ============================================================
    */

    window.getLashawnStaff = function () {

        try {

            const stored =
                sessionStorage.getItem(
                    "lashawn_staff"
                );

            if (!stored) return null;

            return JSON.parse(stored);

        } catch (error) {

            console.error(
                "Could not read staff session:",
                error
            );

            return null;

        }

    };


    /*
    ============================================================
    ROLE CHECK
    ============================================================
    */

    window.hasLashawnRole = function (
        allowedRoles
    ) {

        const staff =
            window.getLashawnStaff();

        if (!staff) return false;

        if (!Array.isArray(allowedRoles)) {

            allowedRoles = [allowedRoles];

        }

        return allowedRoles.includes(
            staff.role
        );

    };


    /*
    ============================================================
    INITIALIZE
    ============================================================
    */

    checkExistingSession();

})();
