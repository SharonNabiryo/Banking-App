from contextlib import nullcontext

from Bank import Bank
from Account import Account
from BankUtility import BankUtility
from CoinCollector import CoinCollector


class BankManager:
    def __init__(self):
        # Create an instance of the Bank class.
        self.bank = Bank()
       
    @staticmethod
    def promptForAccountNumberAndPIN(bank: Bank):
        """
        Prompts the user for their account number and PIN.
        Returns the account if both inputs are valid, otherwise None.
        """
        try:
            accountNumber_input = int(input("Enter account number: \n"))
        except ValueError:
            print("Invalid account number. Please enter a numeric value.")
            return None

        # Find the account in the bank based on the account number.
        account = bank.findAccount(accountNumber_input)

        # Check if account exists.
        if account is None:
            print(f"Account not found for account number: {accountNumber_input}")
            return None

        # Validate PIN input.
        while True:
            pin_Input = BankUtility.promptUserForString("Enter PIN: \n")
            if account.isValidPIN(pin_Input):
                return account  # Return the account if PIN is correct.
            else:
                print("Invalid PIN")


    def main(self):
        """
        Main menu loop for the banking application.
        Displays user choices and processes the selected actions.
        """
        while True:
            print("+----------------MENU--------------------+")
            print("What do you want to do?")
            print("1) Open an Account")
            print("2) Get account information and balance")
            print("3) Change PIN")
            print("4) Deposit money in account")
            print("5) Transfer money between accounts.")
            print("6) Withdraw money from account")
            print("7) ATM Withdrawal.")
            print("8) Deposit change")
            print("9) Close an account")
            print("10) Add monthly interest to all accounts")
            print("11) Print all existing accounts.")
            print("12) End program")
            print("+------------------------------------------+")


            # Validate user input for menu choice.
            try:
                choice = int(input(">>>Input: ").strip())
            except ValueError:
                print("Please enter a valid input")
                continue

            if choice == 1:
                # Open an Account
                if len(self.bank.getAccounts()) >= self.bank.getNumOfAccounts():
                    print("The bank is full. No more accounts can be created.")
                    continue  # Skip further input if the bank is full.

                # Prompt for first and last names.
                firstName = BankUtility.promptUserForString("Enter Account Owner's First Name: \n")
                lastName = BankUtility.promptUserForString("Enter Account Owner's Last Name: \n")

                # Loop to re-prompt user until a valid SSN is provided
                while True:
                    ssn = BankUtility.promptUserForString("Enter Account Owner's SSN (9 digits): ")

                    # check if SSN is valid and doesn't already exist.
                    if len(ssn) == 9 and BankUtility.isNumeric(ssn) and ssn.startswith("999"):
                        if self.bank.isDuplicateSSN(ssn):
                            print("SSN already exists. Please enter a different SSN.")
                        else:
                            break
                    else:
                        print("Social Security Number must be 9 digits (and start with '999').")

                #create an empty account with initial values
                account = Account("", "", "")

                #Use setter methods to set the values
                account.setOwnerFirstName(firstName)
                account.setOwnerLastName(lastName)
                account.setOwnerSSN(ssn)

                # Create and add the account to the bank.
                if self.bank.addAccountToBank(account):
                    print("===================================")
                    print(account.toString())  # Use the toString() method from the Account class to display account details.
                    print("=====================================")

            elif choice == 2:
                # Get account information and balance.
                account = self.promptForAccountNumberAndPIN(self.bank)
                if account: # if account is valid, print its details
                    print("===================================")
                    print(account.toString())
                    print("=====================================")

            elif choice == 3:
                # Change PIN
                account = self.promptForAccountNumberAndPIN(self.bank)
                if account:
                    account.setOwnerPin(account.getOwnerPin()) # setter for the new pin

            elif choice == 4:
                # Deposit money into account.
                account = self.promptForAccountNumberAndPIN(self.bank)
                if account:
                    amount = BankUtility.promptUserForPositiveNumber("Enter amount to deposit in dollars and cents (e.g. 2.57): \n")
                    if amount is not None:
                        amount_in_cents = round(float(amount) * 100)
                        account.deposit(int(amount_in_cents)) # Convert to cents.
                        print(f"New balance: ${account.getBalance() / 100:.2f}")

            elif choice == 5:
                # Transfer money between accounts.
                print("Account to Transfer From:")
                account1 = self.promptForAccountNumberAndPIN(self.bank)

                if account1:
                    print("Account to Transfer to.")
                    account2 = self.promptForAccountNumberAndPIN(self.bank)

                    if account2:
                        amount = BankUtility.promptUserForPositiveNumber("Enter amount to transfer in dollars and cents (e.g. 2.57): \n")

                        # Check if the account has sufficient funds for the withdrawal
                        if amount > account1.getBalance() / 100:
                            print(f"Insufficient funds in account {account1.getOwnerAccountNumber()}")
                        else:
                            amount_in_cents = round(float(amount) * 100)
                            account1.withdraw(int(amount_in_cents))   # Withdraw from first account.
                            account2.deposit(int(amount_in_cents))   #  Deposit into second account.

                            print("Transfer Complete.")
                            print(f"New balance in account: {account1.getOwnerAccountNumber()} is: ${account1.getBalance() / 100:.2f}")
                            print(f"New balance in account: {account2.getOwnerAccountNumber()} is: ${account2.getBalance() / 100:.2f}")

            elif choice == 6:
                 # Withdraw money from account.
                account = self.promptForAccountNumberAndPIN(self.bank)

                if account:
                    amount = BankUtility.promptUserForPositiveNumber("Enter amount to withdraw in dollars and cents (e.g. 2.57): ")

                    # Check if the account has sufficient funds for the withdrawal
                    if amount > account.getBalance():
                        print(f"Insufficient funds in account {account.getOwnerAccountNumber()}")
                    else:
                        amount_in_cents = round(float(amount) * 100)
                        account.withdraw(int(amount_in_cents))
                        print(f"New balance: ${account.getBalance() / 100:.2f}")

            elif choice == 7:
                # ATM withdrawal.
                account = self.promptForAccountNumberAndPIN(self.bank)


                if account:
                    while True:
                        amount = BankUtility.promptUserForPositiveNumber(
                        "Enter amount to withdraw in dollars (no cents) in multiples of $5 (limit $1000): ")

                        if amount < 5 or amount > 1000 or amount % 5 != 0:
                            print("Invalid amount. Try again.")
                            continue

                        # Check if the account has sufficient funds for the withdrawal
                        if amount > account.getBalance() / 100:  # Compare with account balance in dollars
                            print(f"Insufficient funds in account {account.getOwnerAccountNumber()}.")
                            break  # Exit the loop if insufficient funds

                        # Withdraw amount and display the breakdown of bills.
                        twenty_bills = amount // 20
                        remaining_after_twenty = amount % 20

                        ten_bills = remaining_after_twenty // 10
                        remaining_after_ten = remaining_after_twenty % 10

                        five_bills = remaining_after_ten // 5

                        #print the number of each bill
                        print(f"Number of 20-dollar bills: {int(twenty_bills)}")
                        print(f"Number of 10-dollar bills: {int(ten_bills)}")
                        print(f"Number of 5-dollar bills: {int(five_bills)}")

                        # withdraw from the account (convert to cents)
                        account.withdraw(int(float(amount) * 100))

                        #print the updated balance
                        print(f"New balance: ${account.getBalance() / 100:.2f}")
                        break

            elif choice == 8:
                # Deposit coins.
                account = self.promptForAccountNumberAndPIN(self.bank)
                if account:
                    coins = BankUtility.promptUserForString("Deposit coins: ")
                    collector = CoinCollector()
                    cents = collector.parseChange(coins)
                    account.deposit(cents)
                    print(f"${cents / 100:.2f} deposited into account")
                    print(f"New balance: ${account.getBalance() / 100:.2f}")


            elif choice == 9:
                # Close an account.
                account = self.promptForAccountNumberAndPIN(self.bank)
                if account:
                    self.bank.removeAccountFromBank(account)
                    print(f"Account {account.getOwnerAccountNumber()} closed.")

            elif choice == 10:
                # Add monthly interest to all accounts.
                interest_rate = float(BankUtility.promptUserForString("Enter annual interest rate percentage (e.g. 2.75 for 2.75%): "))
                self.bank.addMonthlyInterest(interest_rate)

            elif choice == 11:
                accounts = self.bank.printAllAccounts()
                print(accounts) # print individual account

            elif choice == 12:
                # End the program.
                print("Exiting program...")
                break

            else:
                print("Invalid choice.")

bank_manager = BankManager()
bank_manager.main()