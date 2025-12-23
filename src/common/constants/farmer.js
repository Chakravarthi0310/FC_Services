const farmerVerificationStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

const farmerVerificationStatusNames = Object.values(farmerVerificationStatus);

module.exports = {
    farmerVerificationStatus,
    farmerVerificationStatusNames,
};
