import bcrypt from "bcrypt";

async function hashPassword(string) {
  const hashedPassword = await bcrypt.hash(string, 12);
  return hashedPassword;
}

// const password = await hashPassword("john456");
// console.log(password);

const hash = "$2b$12$9kMsHzJVgkHrODaJ5U.QZet08B0hAiZWrpL017IeUOABigF.rxyIm\n";

console.log(await bcrypt.compare("john455", hash.trim()));
// ✅ true
