from BankUtility import BankUtility

class Account:
    # Constructor to initialize the account details
    def __init__(self, firstName, lastName, ssn: str):
        # Randomly generate an 8-digit account number
        self.__accountNumber = BankUtility.generateRandomInteger(10000000, 99999999)
        # Store the owner's first name, last name, and social security number (SSN)
        self.__firstName = firstName
        self.__lastName = lastName
        self.__ssn = ssn
        # Generate a random 4-digit PIN as a string
        self.__pin = str(BankUtility.generateRandomInteger(1000, 9999))
        # Set the initial balance to 0 (in cents)
        self.__balance = 0

    # Accessor methods for private attributes
    # Returns the first name of the account owner
    def getOwnerfirstName(self):
        return self.__firstName

    # Updates the first name of the account owner (capitalized)
    def setOwnerFirstName(self, firstName):
       self.__firstName = firstName.capitalize()

    # Returns the last name of the account owner
    def getOwnerlastName(self):
        return self.__lastName

    # Updates the last name of the account owner (capitalized)
    def setOwnerLastName(self, lastName):
        self.__lastName = lastName.capitalize()

    # Returns the SSN of the account owner
    def getOwnerSSN(self):
        return self.__ssn

    # Returns a formatted version of the SSN, hiding the first five digits
    def getFormattedSSN(self):
        return f"XXX-XXX-{self.__ssn[-4:]}"

    # Updates the SSN of the account owner
    def setOwnerSSN(self, ssn):
        self.__ssn = ssn

    # Returns the PIN of the account owner
    def getOwnerPin(self):
        return self.__pin

    # Updates the PIN of the account owner after user input and confirmation
    def setOwnerPin(self, pin): #setting a new pin
        while True:
            # Prompt the user to enter a new 4-digit PIN
            attempt1 = BankUtility.promptUserForString("Enter new PIN: ")
            if len(attempt1) != 4:
                print("PIN must be 4 digits, try again.")
                continue

            # Ensure that the entered PIN is numeric
            if not BankUtility.isNumeric(attempt1):
                print(f"{attempt1} is not a number.")
                continue

            # Ask for confirmation by re-entering the new PIN
            attempt2 = BankUtility.promptUserForString("Enter new PIN again to confirm: ")
            if attempt1 == attempt2:
                # Set the new PIN if both entries match
                self.__pin = attempt1
                print("PIN updated")
                break
            else:
                print("PINs do not match, try again.")

    # Returns the account number of the account owner
    def getOwnerAccountNumber(self):
        return self.__accountNumber

    # Returns the balance of the account (in cents)
    def getBalance(self):
        return self.__balance

    # Method to deposit money into the account
    # Only adds the amount if it is positive
    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount
            return self.__balance

    # Method to withdraw money from the account
    def withdraw(self, amount: int):
         self.__balance -= amount
         return self.__balance

    # Verifies if the provided PIN matches the account's PIN
    def isValidPIN(self, pin) -> bool:
        return self.__pin == pin # returns True

    
    # Custom toString method to display account details in a formatted string
    def toString(self):
        return (f"Account Number: {self.__accountNumber}\n"
                f"Owner First Name: {self.__firstName}\n"
                f"Owner Last Name: {self.__lastName}\n"
                f"Owner SSN: {self.getFormattedSSN()}\n"
                f"PIN : {self.__pin}\n"
                f"Balance: ${self.__balance / 100:.2f}")

    # Custom __repr__ method to return a representation of the account object
    def __repr__(self):
        return (f"Account(accountNumber = {self.__accountNumber}, "
                f"firstName = '{self.__firstName}', "
                f"lastName = '{self.__lastName}',"
                f"SSN = '{self.getFormattedSSN()}',"
                f" PIN ={self.__pin}, " 
                f"balance = {self.__balance / 100:.2f})")



