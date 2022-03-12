/**
 * An user object
 */
class User {
    /**
    * A constructor
    */
    constructor(userRole, email) {
        this.Id = 0;
        this.UserRole = userRole;
        this.EmailAddress = email;
    }
}

module.exports = User