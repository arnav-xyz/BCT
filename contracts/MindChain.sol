// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MindChain - Decentralized Mental Health & Mood Tracker
 * @dev A privacy-preserving smart contract enabling users to log tamper-proof mental wellness
 * records and selectively grant access to licensed therapists.
 * 
 * Key Principles:
 * 1. Data Ownership: The patient owns their health record via their Ethereum address.
 * 2. Privacy & Encryption: Personal notes are encrypted client-side before submission.
 * 3. Selective Disclosure: Only the patient or an authorized therapist can query the patient's records.
 * 4. Immutability: Historical logs cannot be tampered with or retroactively altered.
 */
contract MindChain {

    struct MoodEntry {
        uint256 id;
        uint256 timestamp;
        uint8 moodScore;       // Scale: 1 (Severe Distress) to 10 (Optimal / Joyful)
        uint8 anxietyScore;    // Scale: 1 (Completely Calm) to 10 (Severe Panic / Anxiety)
        uint8 sleepHours;      // Whole hours of sleep (0 - 24)
        string activityTag;    // e.g. "Meditation", "Work", "Therapy", "Exercise", "Insomnia"
        string encryptedNote;  // Client-side AES-encrypted journal entry or IPFS CID
        bool isCrisis;         // Flagged true if mood <= 2 and anxiety >= 8
    }

    // Mapping: Patient Address => Array of Mood Entries
    mapping(address => MoodEntry[]) private patientEntries;

    // Mapping: Patient Address => (Therapist Address => Authorization Status)
    mapping(address => mapping(address => bool)) public isTherapistAuthorized;

    // Mapping: Patient Address => List of authorized therapists (for patient viewing)
    mapping(address => address[]) private authorizedTherapistsList;

    // Events
    event MoodEntryLogged(
        address indexed patient,
        uint256 indexed entryId,
        uint8 moodScore,
        uint8 anxietyScore,
        uint256 timestamp,
        bool isCrisis
    );

    event TherapistAuthorized(address indexed patient, address indexed therapist);
    event TherapistRevoked(address indexed patient, address indexed therapist);
    event CrisisAlert(address indexed patient, uint256 timestamp, uint8 moodScore, uint8 anxietyScore);

    /**
     * @notice Log a daily mental wellness check-in
     * @param _moodScore Score from 1 to 10
     * @param _anxietyScore Score from 1 to 10
     * @param _sleepHours Hours of sleep (0 to 24)
     * @param _activityTag Category tag (e.g., "Meditation", "Work")
     * @param _encryptedNote Client-side encrypted reflection text
     */
    function logMoodEntry(
        uint8 _moodScore,
        uint8 _anxietyScore,
        uint8 _sleepHours,
        string calldata _activityTag,
        string calldata _encryptedNote
    ) external returns (uint256) {
        require(_moodScore >= 1 && _moodScore <= 10, "MindChain: Mood score must be between 1 and 10");
        require(_anxietyScore >= 1 && _anxietyScore <= 10, "MindChain: Anxiety score must be between 1 and 10");
        require(_sleepHours <= 24, "MindChain: Sleep hours cannot exceed 24");

        bool crisisFlag = (_moodScore <= 2 && _anxietyScore >= 8);
        uint256 newId = patientEntries[msg.sender].length + 1;

        MoodEntry memory newEntry = MoodEntry({
            id: newId,
            timestamp: block.timestamp,
            moodScore: _moodScore,
            anxietyScore: _anxietyScore,
            sleepHours: _sleepHours,
            activityTag: _activityTag,
            encryptedNote: _encryptedNote,
            isCrisis: crisisFlag
        });

        patientEntries[msg.sender].push(newEntry);

        emit MoodEntryLogged(
            msg.sender,
            newId,
            _moodScore,
            _anxietyScore,
            block.timestamp,
            crisisFlag
        );

        if (crisisFlag) {
            emit CrisisAlert(msg.sender, block.timestamp, _moodScore, _anxietyScore);
        }

        return newId;
    }

    /**
     * @notice Authorize a therapist address to view caller's records
     * @param _therapist The Ethereum address of the therapist
     */
    function authorizeTherapist(address _therapist) external {
        require(_therapist != address(0), "MindChain: Invalid address");
        require(_therapist != msg.sender, "MindChain: Cannot authorize self as therapist");
        
        if (!isTherapistAuthorized[msg.sender][_therapist]) {
            isTherapistAuthorized[msg.sender][_therapist] = true;
            authorizedTherapistsList[msg.sender].push(_therapist);
            emit TherapistAuthorized(msg.sender, _therapist);
        }
    }

    /**
     * @notice Revoke therapist access to caller's records
     * @param _therapist The Ethereum address of the therapist
     */
    function revokeTherapist(address _therapist) external {
        require(isTherapistAuthorized[msg.sender][_therapist], "MindChain: Therapist not authorized");

        isTherapistAuthorized[msg.sender][_therapist] = false;

        // Clean up list
        address[] storage list = authorizedTherapistsList[msg.sender];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == _therapist) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }

        emit TherapistRevoked(msg.sender, _therapist);
    }

    /**
     * @notice Get all entries for the caller (patient)
     */
    function getMyEntries() external view returns (MoodEntry[] memory) {
        return patientEntries[msg.sender];
    }

    /**
     * @notice Get entry count for caller
     */
    function getMyEntryCount() external view returns (uint256) {
        return patientEntries[msg.sender].length;
    }

    /**
     * @notice Retrieve patient records (accessible ONLY by patient or authorized therapist)
     * @param _patient Address of the patient whose records to view
     */
    function getPatientEntries(address _patient) external view returns (MoodEntry[] memory) {
        require(
            msg.sender == _patient || isTherapistAuthorized[_patient][msg.sender],
            "MindChain: Access denied. You are not authorized to view this patient's records."
        );
        return patientEntries[_patient];
    }

    /**
     * @notice Get list of authorized therapists for the caller
     */
    function getMyAuthorizedTherapists() external view returns (address[] memory) {
        return authorizedTherapistsList[msg.sender];
    }

    /**
     * @notice Check if a specific therapist is authorized for a patient
     */
    function checkTherapistAccess(address _patient, address _therapist) external view returns (bool) {
        return isTherapistAuthorized[_patient][_therapist];
    }
}

