// ============================================================
// LASHAWN ACADEMY
// OFFICE ADMIN ROLE GUARD
// ============================================================

(function () {
    'use strict';

    const DB = window.LashawnDB;

    // ---------------------------------------------------------
    // Require authenticated Office Admin
    // ---------------------------------------------------------
    window.requireAdminAccess = async function () {

        if (!DB) {
            console.error('Lashawn Supabase is not configured.');
            window.location.replace('login.html');
            return false;
        }

        try {

            const {
                data: { session },
                error: sessionError
            } = await DB.auth.getSession();

            if (sessionError) {
                console.error('Session error:', sessionError);
                window.location.replace('login.html');
                return false;
            }

            if (!session || !session.user) {
                console.warn('No authenticated user.');
                window.location.replace('login.html');
                return false;
            }

            const user = session.user;

            // -------------------------------------------------
            // Read roles from Supabase Auth metadata
            // -------------------------------------------------

            const appMetadata = user.app_metadata || {};
            const userMetadata = user.user_metadata || {};

            const role =
                appMetadata.role ||
                userMetadata.role ||
                '';

            const accountType =
                appMetadata.account_type ||
                userMetadata.account_type ||
                '';

            const officeRole =
                userMetadata.office_role ||
                '';

            console.log('Logged-in user:', user.email);
            console.log('Role:', role);
            console.log('Account type:', accountType);
            console.log('Office role:', officeRole);

            // -------------------------------------------------
            // Allowed Office Admin roles
            // -------------------------------------------------

            const allowed =
                role === 'admin' ||
                role === 'staff' ||
                accountType === 'admin' ||
                accountType === 'staff' ||
                officeRole === 'Office Admin';

            if (!allowed) {

                console.error(
                    'User authenticated but does not have admin/staff access.'
                );

                await DB.auth.signOut();

                alert('You do not have Office Admin access.');

                window.location.replace('login.html');

                return false;
            }

            // -------------------------------------------------
            // Successfully authenticated
            // -------------------------------------------------

            console.log('Office Admin access granted.');

            return true;

        } catch (error) {

            console.error(
                'Office Admin authentication error:',
                error
            );

            window.location.replace('login.html');

            return false;
        }
    };


    // ---------------------------------------------------------
    // Logout helper
    // ---------------------------------------------------------

    window.logoutAdmin = async function () {

        try {

            if (DB) {
                await DB.auth.signOut();
            }

        } catch (error) {

            console.error('Logout error:', error);

        } finally {

            window.location.replace('login.html');

        }
    };

})();
