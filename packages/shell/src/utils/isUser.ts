import User from '../User';

export default function isUser(input: any): input is User {
  return input instanceof User;
}
