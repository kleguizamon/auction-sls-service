import createError from 'http-errors';
import { getEndedAuctions } from '../lib/getEndedAuctions';
import { closeAuction } from '../lib/closeAuction';

const processAuctions = async (event, context) => {
   try {
      const auctionToClose = await getEndedAuctions();
      const closePromises = auctionToClose.map(auction => closeAuction(auction));
      await Promise.all(closePromises);
      //return amount promise
      return { closed: closePromises.length };
   } catch(err) {
      console.log(err);
      throw new createError.InternalServerError(err);
   };
};

export const handler = processAuctions;
