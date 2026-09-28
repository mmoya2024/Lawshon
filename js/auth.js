/* ============================================================
   LASHAWN ACADEMY
   AUTHENTICATION
   ============================================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* --------------------------------------------------------
       SUPABASE
       -------------------------------------------------------- */

    const db = window.LashawnDB;

    if (!db) {
        console.error("LashawnDB is not available.");
        showMessage(
            "System connection error. Please check the Supabase configuration.",
            "error"
        );
        return;
    }


    /* --------------------------------------------------------
       ELEMENTS
       -------------------------------------------------------- */

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("loginButton");
    const messageBox = document.getElementById("message");
    const togglePassword = document.getElementById("togglePassword");


    /* --------------------------------------------------------
       DASHBOARD
       -------------------------------------------------------- */

    const DASHBOARD_URL = "dashboard.html";


    /* --------------------------------------------------------
       ROLE NAMES
       -------------------------------------------------------- */

    const ROLE_NAMES = {
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


    /* --------------------------------------------------------
       MESSAGE
       -------------------------------------------------------- */

    function showMessage(message, type = "error") {

        if (!messageBox) return;

        messageBox.textContent = message;
        messageBox.className = `message ${type}`;
        messageBox.style.display = "block";
    }


    function clearMessage() {

        if (!messageBox) return;

        messageBox.textContent = "";
        messageBox.className = "message";
        messageBox.style.display = "none";
    }


    /* --------------------------------------------------------
       LOADING STATE
       -------------------------------------------------------- */

    function setLoading(loading) {

        if (!loginButton) return;

        loginButton.disabled = loading;

        if (loading) {

            loginButton.innerHTML =
                '<span class="loading-spinner"></span> Signing in...';

        } else {

            loginButton.textContent = "Sign In";

        }
    }


    /* --------------------------------------------------------
       PASSWORD SHOW / HIDE
       -------------------------------------------------------- */

    if (togglePassword && passwordInput) {

        togglePassword.addEventListener("click", () => {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";
                togglePassword.textContent = "Hide";

            } else {

                passwordInput.type = "password";
                togglePassword.textContent = "Show";

            }

        });

    }


    /* --------------------------------------------------------
       GET STAFF PROFILE
       -------------------------------------------------------- */

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
                "No staff profile is linked to this account."
            );
        }


        return data;
    }


    /* --------------------------------------------------------
       VERIFY STAFF
       -------------------------------------------------------- */

    async function verifyStaff(userId) {

        const staff = await getStaffProfile(userId);


        if (!staff.is_active) {

            await db.auth.signOut();

            throw new Error(
                "Your staff account is inactive. Please contact the administrator."
            );
        }


        return staff;
    }


    /* --------------------------------------------------------
       SAVE STAFF SESSION
       -------------------------------------------------------- */

    function saveStaff(staff) {

        sessionStorage.setItem(
            "lashawn_staff",
            JSON.stringify(staff)
        );
    }


    /* --------------------------------------------------------
       REMOVE STAFF SESSION
       -------------------------------------------------------- */

    function clearStaff() {

        sessionStorage.removeItem(
            "lashawn_staff"
        );
    }


    /* --------------------------------------------------------
       LOGIN
       -------------------------------------------------------- */

    async function login(email, password) {

        clearMessage();
        setLoading(true);

        try {

            /* Authenticate with Supabase */

            const {
                data,
                error
            } = await db.auth.signInWithPassword({
                email,
                password
            });


            if (error) {

                console.error(
                    "Supabase login error:",
                    error
                );

                throw new Error(
                    "Invalid email or password."
                );
            }


            if (!data || !data.user) {

                throw new Error(
                    "Login failed. Please try again."
                );
            }


            /* Verify staff account */

            const staff = await verifyStaff(
                data.user.id
            );


            /* Save staff profile */

            saveStaff(staff);


            /* Display success */

            const roleName =
                ROLE_NAMES[staff.role] || staff.role;


            showMessage(
                `Welcome ${staff.first_name}. Signing in as ${roleName}...`,
                "success"
            );


            /* Redirect */

            setTimeout(() => {

                window.location.href =
                    DASHBOARD_URL;

            }, 700);


        } catch (error) {

            console.error(
                "Login failed:",
                error
            );

            try {
                await db.auth.signOut();
            } catch (signOutError) {
                console.error(
                    "Sign-out error:",
                    signOutError
                );
            }

            clearStaff();

            showMessage(
                error.message ||
                "Unable to sign in.",
                "error"
            );

            setLoading(false);
        }
    }


    /* --------------------------------------------------------
       LOGIN FORM
       -------------------------------------------------------- */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const email =
                    emailInput.value
                        .trim()
                        .toLowerCase();

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


    /* --------------------------------------------------------
       EXISTING SESSION
       -------------------------------------------------------- */

    async function checkExistingSession() {

        try {

            const session =
                await window.getSession();


            if (!session) {
                return;
            }


            const staff =
                await verifyStaff(
                    session.user.id
                );


            saveStaff(staff);


            /*
             * User is already logged in.
             * Go to dashboard.
             */

            window.location.href =
                DASHBOARD_URL;


        } catch (error) {

            console.warn(
                "Existing session is not valid:",
                error.message
            );

            clearStaff();

            try {
                await db.auth.signOut();
            } catch (signOutError) {
                console.error(
                    signOutError
                );
            }
        }
    }


    /* --------------------------------------------------------
       AUTH STATE
       -------------------------------------------------------- */

    db.auth.onAuthStateChange(
        (event, session) => {

            console.log(
                "Lashawn authentication event:",
                event
            );

        }
    );


    /* --------------------------------------------------------
       GLOBAL STAFF HELPERS
       -------------------------------------------------------- */

    window.getLashawnStaff = function () {

        try {

            const staff =
                sessionStorage.getItem(
                    "lashawn_staff"
                );

            return staff
                ? JSON.parse(staff)
                : null;

        } catch (error) {

            console.error(
                "Staff session error:",
                error
            );

            return null;
        }
    };


    window.hasLashawnRole = function (
        allowedRoles
    ) {

        const staff =
            window.getLashawnStaff();


        if (!staff) {
            return false;
        }


        if (!Array.isArray(allowedRoles)) {
            allowedRoles = [allowedRoles];
        }


        return allowedRoles.includes(
            staff.role
        );
    };


    window.lashawnLogout = async function () {

        clearStaff();

        try {

            await db.auth.signOut();

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );
        }

        window.location.href =
            "login.html";
    };


    /* --------------------------------------------------------
       INITIALIZE
       -------------------------------------------------------- */

    checkExistingSession();

});
