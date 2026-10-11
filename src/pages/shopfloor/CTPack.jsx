import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GlobalStyles, PackLogisticsView } from "./components/CTPack";
import { fetchCtPackJobs } from "../../reducer/ctPackReducer";
import { fetchAllUsers } from "../../reducer/userReducer";
import { useLoader } from "../../context/LoaderContext";

export default function PackingConsoleApp() {
  const dispatch = useDispatch();
  const { jobs = [], pagination = {}, counts = {} } = useSelector((state) => state.ctPack || {});
  const { showLoader, hideLoader } = useLoader();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchJobs = useCallback(async () => {
    showLoader();
    try {
      await dispatch(fetchCtPackJobs({ page, limit, status: statusFilter, search: debouncedSearch })).unwrap();
    } catch (err) {
      console.error("Failed to fetch packing jobs:", err);
    } finally {
      hideLoader();
    }
  }, [dispatch, page, limit, statusFilter, debouncedSearch, showLoader, hideLoader]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  return (
    <>
      <GlobalStyles />
      <PackLogisticsView 
        packJobs={jobs} 
        onRefresh={fetchJobs} 
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        pagination={pagination}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusFilterChange}
        counts={counts}
        search={search}
        setSearch={setSearch}
      />
    </>
  );
}