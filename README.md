# 0xsplit

0xsplit. Split bills between friends. Payback with your desired token.

Split bills with your friends and get paid in your favorite token. Nobody cares that you bought “flowers” from your friend at 12 am on a Saturday. Don’t have the token needed to pay back your friend? Use 0x and networked liquidity to exchange into the requested token.

#### Features

##### 1. Contacts
- Add a new contact by giving a nickname and an ETH address. While adding a contact, you also have the option to send a transation to invite them!
- Delete a contact (only if there are no expenses between you both)
- Settle expenses with a contact, irrespective of the ERC20 token in which they paid you! *Thanks 0x!*
- Search expenses based on contact details, with advanced search options supported.
- Contacts are listed on the top right section.

##### 2. Expenses
- Expense supports the following fields: `Description`, `Contact`, `ERC20 token`, `Amount`, `Timestamp`, `Notes`, `Picture`.
- Each expense can be split among your contact in three ways: **Split equally** (where you can even have expenses where contact owes you the full amount), **Split unequally** (you can decide how much each of you owe) and **Split by percentage**.
- An expense can be updated as well as deleted. But an expense that is added by one of your contacts cannot be edited by you (you can only delete it).
- It's assumed that the person who adds the expense is the one who paid for the expense.
- Expenses are displayed based on their timestamps with the latest ones on top. Scrolling down will display more and more expenses until there are no more.
- Expenses are listed in the center of the page.
- Editing of the contact name attached to an expense is not allowed.
- If an expense is added by a contact who is not present in your contacts list, you shall be prompted to add this contact.
- The image in the expense is hosted using IPFS.

##### 3. Orders
- Orders are satisifed through 0x protocol.
- Only a handful of tokens are initially supported (BAT, ZIL, ...)
- The relayer is hosted at: https://ox-relayer.herokuapp.com/v2/
- Users have the option to swap their tokens for their desired tokens (to pay off their debts, or simply for trading purposes!).
