/* Helpers to control access permissions of favorites and interpretations.
 *
 * A favorite sharing must be a superset of all its interpretations sharings.
 * An interpretation sharing must be a subset of its parent object sharing.

 Permissions checked: publicAccess, userGroupAccesses and userAccesses.
 */

const accesses = {
    "--------": "private",
    "r-------": "read",
    "rw------": "read-write",
};

const permissionFields = [
    "publicAccess",
    "userAccesses",
    "userGroupAccesses",
];

const toArray = (obj) => obj || [];

export const checkValidationCondition = function(validator, oldValue, newValue, showError) {
    const oldValueValidates = oldValue ? validator(oldValue) : true;
    const newValueValidates = validator(newValue);

    if (oldValueValidates && newValueValidates) {
        return true;
    } else if (oldValueValidates && !newValueValidates) {
        showError && showError();
        return false;
    } else if (!oldValueValidates && newValueValidates) {
        return true;
    } else if (!oldValueValidates && !newValueValidates) {
        showError && showError();
        return true;
    }
};

const isObjectAccessible = function(favoriteAccess, objectAccess) {
    return !(accesses[favoriteAccess] === "private" && accesses[objectAccess] !== "private");
};

export const validateFieldAccess = function(modelName, favorite, showError, field, oldValue, newValue) {
    const modelKey = modelName === "interpretation" ? modelName : "favorite";
    const interpretations = toArray(favorite.interpretations);
    let predicate;

    switch (modelKey + "-" + field) {
        /* Interpretations validations: check that its sharing is a subset of the favorite sharing */
        case "interpretation-publicAccess":
            predicate = value => isObjectAccessible(favorite[field], value);
            break;
        case "interpretation-userAccesses":
        case "interpretation-userGroupAccesses":
            const favoritePermissionIds = new Set(toArray(favorite[field]).map(p => p.id));
            predicate = permissions => toArray(permissions)
                .every(permission => favoritePermissionIds.has(permission.id));
            break;

        /* Favorite validations: check that all its interpretation sharings are a subset of this favorite sharing */
        case "favorite-publicAccess":
            predicate = value =>
                interpretations.every(interpretation => isObjectAccessible(value, interpretation[field]));
            break;
        case "favorite-userAccesses":
        case "favorite-userGroupAccesses":
            predicate = favoritePermissions => {
                const favoritePermissionIds = new Set(toArray(favoritePermissions).map(p => p.id));
                return interpretations.every(interpretation =>
                    toArray(interpretation[field]).every(interpretationPermission =>
                        favoritePermissionIds.has(interpretationPermission.id)));
            };
            break;
        default:
            throw new Error("[validateFieldAccess] unknown field key: " + modelKey);
    }

    return checkValidationCondition(predicate, oldValue, newValue, showError);
};

export const validateSharing = function(modelName, favorite, sharing, showError) {
    if (!favorite || !sharing) {
        return true;
    } else {
        const isValid = permissionFields.every(field =>
            validateFieldAccess(modelName, favorite, null, field, null, sharing[field]));
        if (!isValid)
            showError();
        return isValid;
    }
};
