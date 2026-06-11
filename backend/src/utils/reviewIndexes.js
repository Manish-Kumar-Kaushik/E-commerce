import '../config/env.js';
import mongoose from 'mongoose';
import connectDB, { getDatabaseStatus } from '../config/db.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import VendorWallet from '../models/VendorWallet.js';
import logger from './logger.js';

const REVIEW_LIMITS = {
  maxExecutionTimeMillis: Number(process.env.INDEX_REVIEW_MAX_EXECUTION_MS) || 50,
  maxDocsExaminedPerReturnedDoc: Number(process.env.INDEX_REVIEW_MAX_DOCS_EXAMINED_PER_RETURNED_DOC) || 10,
  maxDocsExaminedWithoutResults: Number(process.env.INDEX_REVIEW_MAX_DOCS_EXAMINED_WITHOUT_RESULTS) || 100,
};

const printLine = (message) => {
  process.stdout.write(`${message}\n`);
};

const extractWinningPlan = (explainOutput = {}) => {
  const queryPlanner = explainOutput.queryPlanner || {};
  return queryPlanner.winningPlan || explainOutput.winningPlan || null;
};

const toSummary = (name, explainOutput = {}) => {
  const stats = explainOutput.executionStats || {};
  const winningPlan = extractWinningPlan(explainOutput);

  return {
    name,
    nReturned: stats.nReturned ?? 0,
    totalDocsExamined: stats.totalDocsExamined ?? 0,
    totalKeysExamined: stats.totalKeysExamined ?? 0,
    executionTimeMillis: stats.executionTimeMillis ?? 0,
    winningPlanStage: winningPlan?.stage || winningPlan?.inputStage?.stage || 'unknown',
  };
};

const evaluateThresholds = (summary) => {
  const issues = [];
  const { nReturned, totalDocsExamined, executionTimeMillis } = summary;

  if (executionTimeMillis > REVIEW_LIMITS.maxExecutionTimeMillis) {
    issues.push(
      `executionTimeMillis ${executionTimeMillis}ms exceeded ${REVIEW_LIMITS.maxExecutionTimeMillis}ms`,
    );
  }

  if (nReturned > 0) {
    const docsPerResult = totalDocsExamined / nReturned;
    if (docsPerResult > REVIEW_LIMITS.maxDocsExaminedPerReturnedDoc) {
      issues.push(
        `docsExamined/result ${docsPerResult.toFixed(2)} exceeded ${REVIEW_LIMITS.maxDocsExaminedPerReturnedDoc}`,
      );
    }
  } else if (totalDocsExamined > REVIEW_LIMITS.maxDocsExaminedWithoutResults) {
    issues.push(
      `docsExamined ${totalDocsExamined} exceeded ${REVIEW_LIMITS.maxDocsExaminedWithoutResults} while returning no rows`,
    );
  }

  return issues;
};

const runExplainChecks = async () => {
  await Promise.all([
    Order.createIndexes(),
    Product.createIndexes(),
    VendorWallet.createIndexes(),
  ]);

  const sampleOrder = await Order.findOne().sort({ createdAt: -1 }).lean();
  const sampleProduct = await Product.findOne().sort({ createdAt: -1 }).lean();
  const sampleWallet = await VendorWallet.findOne({ 'transactions.0': { $exists: true } }).lean();

  const fallbackOrderId = new mongoose.Types.ObjectId();
  const fallbackVendorId = new mongoose.Types.ObjectId();
  const fallbackSubOrderId = new mongoose.Types.ObjectId();

  const sampleUserId = sampleOrder?.user || fallbackOrderId;
  const sampleReservationDate = sampleOrder?.reservationExpiresAt || new Date();
  const sampleSubOrder = Array.isArray(sampleOrder?.subOrders) ? sampleOrder.subOrders[0] : null;
  const sampleSubOrderVendor = sampleSubOrder?.vendor || sampleOrder?.items?.[0]?.vendor || fallbackVendorId;
  const sampleSubOrderStatus = sampleSubOrder?.status || 'created';
  const sampleProductVendor = sampleProduct?.vendor || fallbackVendorId;
  const sampleWalletSubOrderId = sampleWallet?.transactions?.find((t) => t.subOrderId)?.subOrderId || fallbackSubOrderId;

  const checks = [
    {
      name: 'Order by user latest',
      run: () =>
        Order.find({ user: sampleUserId })
          .sort({ createdAt: -1 })
          .limit(20)
          .explain('executionStats'),
    },
    {
      name: 'Order reservation expiry sweep',
      run: () =>
        Order.find({
          reservationExpiresAt: { $lt: sampleReservationDate },
          paymentStatus: 'pending',
        })
          .limit(20)
          .explain('executionStats'),
    },
    {
      name: 'Order by sub-order vendor status',
      run: () =>
        Order.find({
          'subOrders.vendor': sampleSubOrderVendor,
          'subOrders.status': sampleSubOrderStatus,
        })
          .sort({ createdAt: -1 })
          .limit(20)
          .explain('executionStats'),
    },
    {
      name: 'Product by vendor latest',
      run: () =>
        Product.find({ vendor: sampleProductVendor })
          .sort({ createdAt: -1 })
          .limit(20)
          .explain('executionStats'),
    },
    {
      name: 'Vendor wallet transaction by subOrderId',
      run: () =>
        VendorWallet.find({ 'transactions.subOrderId': sampleWalletSubOrderId })
          .limit(20)
          .explain('executionStats'),
    },
  ];

  const failures = [];

  for (const check of checks) {
    try {
      const result = await check.run();
      const summary = toSummary(check.name, result);
      printLine(JSON.stringify(summary));

      const issues = evaluateThresholds(summary);
      if (issues.length) {
        failures.push({ name: check.name, issues, summary });
      }
    } catch (error) {
      printLine(
        JSON.stringify({
          name: check.name,
          error: error.message,
        }),
      );
      failures.push({ name: check.name, issues: [error.message] });
    }
  }

  if (failures.length) {
    printLine(JSON.stringify({ message: 'Index review thresholds exceeded', limits: REVIEW_LIMITS, failures }));
    process.exitCode = 1;
  } else {
    printLine(JSON.stringify({ message: 'Index review within thresholds', limits: REVIEW_LIMITS }));
  }
};

const main = async () => {
  try {
    const connected = await connectDB();

    if (!connected || getDatabaseStatus() !== 'connected') {
      logger.warn('Index review skipped because MongoDB is not connected.');
      process.exit(0);
    }

    printLine(JSON.stringify({ message: 'Running index review with execution stats' }));
    await runExplainChecks();
  } catch (error) {
    logger.error('Index review failed', error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};

main();
