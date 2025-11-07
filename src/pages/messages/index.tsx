import React from 'react';
import MessagesComponent from '@/components/messages';
import withAuth from "@/utils/withAuth";

const MessagesPage = () => {
  return <MessagesComponent />;
};
export default withAuth(MessagesPage);

